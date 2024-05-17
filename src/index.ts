import {
    isNonNullType,
    type GraphQLEnumValueConfig,
    type GraphQLFieldConfig,
    type GraphQLInputFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { type GraphQLArgumentConfig } from 'graphql/index';
import { applySchemaTransforms } from '@graphql-mesh/utils';
import { type SubschemaConfig, type Transform } from '@graphql-tools/delegate';
import { MapperKind, mapSchema } from '@graphql-tools/utils';
import {
    TransformCompositeFields,
    TransformEnumValues,
    TransformInputObjectFields,
} from '@graphql-tools/wrap';
import { BaseReplacer, createBaseReplacer } from './replacers/base';
import { createDefaultReplacer } from './replacers/default';
import { createDeprecatedReplacer } from './replacers/deprecated';
import { createDescriptionReplacer } from './replacers/description';
import { createDirectiveReplacer } from './replacers/directive';
import { createExtensionsReplacer } from './replacers/extensions';
import { createNullableReplacer } from './replacers/nullable';
import { createTypeReplacer } from './replacers/type';
import {
    FieldType,
    type ReplaceConfigReplacerDefaultTransformConfig,
    type ReplaceConfigReplacerDeprecatedTransformConfig,
    type ReplaceConfigReplacerDescriptionTransformConfig,
    type ReplaceConfigReplacerDirectiveTransformConfig,
    type ReplaceConfigReplacerExtensionsTransformConfig,
    type ReplaceConfigReplacerNullableTransformConfig,
    type ReplaceConfigReplacerTypeTransformConfig,
    type ReplaceConfigTransformConfig,
    type ReplaceFieldConfig,
} from './types';

export default class ReplaceConfigTransform implements Transform {
    public noWrap: boolean = false;
    private readonly configs: ReplaceConfigTransformConfig[];
    private readonly transformers: Array<
        TransformCompositeFields | TransformInputObjectFields | TransformEnumValues
    >;

    constructor({ config }: { config: ReplaceConfigTransformConfig[] }) {
        this.configs = config?.map((conf: ReplaceConfigTransformConfig) => {
            return {
                ...conf,
                replacers: conf.replacers?.map(replacer => {
                    if (
                        (replacer as ReplaceConfigReplacerDescriptionTransformConfig)
                            .description !== undefined
                    ) {
                        return createDescriptionReplacer(replacer);
                    }

                    if ((replacer as ReplaceConfigReplacerTypeTransformConfig).type) {
                        return createTypeReplacer(replacer);
                    }

                    if (
                        (replacer as ReplaceConfigReplacerDeprecatedTransformConfig).deprecated !==
                        undefined
                    ) {
                        return createDeprecatedReplacer(replacer);
                    }

                    if (
                        (replacer as ReplaceConfigReplacerNullableTransformConfig).nullable !==
                        undefined
                    ) {
                        return createNullableReplacer(replacer);
                    }

                    if ((replacer as ReplaceConfigReplacerDefaultTransformConfig).default) {
                        return createDefaultReplacer(replacer);
                    }

                    if ((replacer as ReplaceConfigReplacerExtensionsTransformConfig).extensions) {
                        return createExtensionsReplacer(replacer);
                    }

                    if ((replacer as ReplaceConfigReplacerDirectiveTransformConfig).directive) {
                        return createDirectiveReplacer(replacer);
                    }

                    return createBaseReplacer(replacer);
                }),
            };
        });

        this.transformers = [
            new TransformCompositeFields(
                (
                    typeName: string,
                    fieldName: string,
                    fieldConfig: GraphQLFieldConfig<any, any>,
                ): GraphQLFieldConfig<any, any> =>
                    this.modifySchema(
                        typeName,
                        fieldName,
                        fieldConfig,
                        FieldType.Composite,
                    ) as GraphQLFieldConfig<any, any>,
            ),
            new TransformInputObjectFields(
                (
                    typeName: string,
                    fieldName: string,
                    inputFieldConfig: GraphQLInputFieldConfig,
                ): GraphQLInputFieldConfig =>
                    this.modifySchema(
                        typeName,
                        fieldName,
                        inputFieldConfig,
                        FieldType.Input,
                    ) as GraphQLInputFieldConfig,
            ),
            new TransformEnumValues(
                (
                    typeName: string,
                    externalValue: string,
                    enumValueConfig: GraphQLEnumValueConfig,
                ): GraphQLEnumValueConfig =>
                    this.modifySchema(
                        typeName,
                        externalValue,
                        enumValueConfig,
                        FieldType.Enum,
                    ) as GraphQLEnumValueConfig,
            ),
        ];
    }

    transformSchema(
        originalWrappingSchema: GraphQLSchema,
        subschemaConfig: SubschemaConfig,
        transformedSchema?: GraphQLSchema,
    ) {
        let newSchema = originalWrappingSchema;
        for (const config of this.configs) {
            for (const replacer of config.replacers) {
                if (!(replacer instanceof BaseReplacer)) {
                    continue;
                }

                newSchema = replacer.extendScheme(newSchema);
            }
        }

        newSchema = mapSchema(newSchema, {
            [MapperKind.ARGUMENT]: (
                argumentConfig: GraphQLArgumentConfig,
                fieldName: string,
                typeName: string,
            ) => {
                return this.modifySchema(
                    typeName,
                    `${fieldName}.${argumentConfig.astNode.name.value}`,
                    argumentConfig,
                    FieldType.Argument,
                ) as GraphQLArgumentConfig;
            },
        });

        return applySchemaTransforms(
            newSchema,
            subschemaConfig,
            transformedSchema,
            this.transformers,
        );
    }

    private modifySchema(
        typeName: string,
        fieldName: string,
        fieldConfig: ReplaceFieldConfig,
        fieldType: FieldType,
    ): any {
        let configs = this.getConfig(typeName, fieldName, fieldType);

        if ((fieldConfig as any).type) {
            const typeConfig = this.getTypeConfig(
                isNonNullType((fieldConfig as any).type)
                    ? (fieldConfig as any).type.ofType.name
                    : (fieldConfig as any).type.name,
            );
            configs = [...configs, ...typeConfig];
        }

        let newFieldConfig = fieldConfig;
        for (const config of configs) {
            if (!config) {
                continue;
            }

            for (const replacer of config.replacers) {
                if (!(replacer instanceof BaseReplacer)) {
                    continue;
                }

                newFieldConfig = replacer.modifySchema(newFieldConfig, fieldType);
            }
        }

        return newFieldConfig;
    }

    private getConfig(
        typeName: string,
        fieldName: string,
        fieldType: FieldType,
    ): ReplaceConfigTransformConfig[] {
        return this.configs?.filter(config => {
            const fields = typeof config.fields === 'string' ? [config.fields] : config.fields;
            const isType = config.typeName === typeName || config.typeName === '*';

            if (fieldType === FieldType.Argument) {
                const [_parentFieldName, argument] = fieldName.split('.');

                if (isType && fields.includes(`*.${argument}`)) {
                    return true;
                }
            }

            return isType && (fields.includes(fieldName) || fields.includes('*'));
        });
    }

    private getTypeConfig(typeName: string): ReplaceConfigTransformConfig[] {
        return this.configs?.filter(
            config => config.typeName === typeName && config.fields === undefined,
        );
    }
}
