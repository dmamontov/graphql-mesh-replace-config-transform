import {
    type GraphQLEnumValueConfig,
    type GraphQLFieldConfig,
    type GraphQLInputFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { applySchemaTransforms } from '@graphql-mesh/utils';
import { type SubschemaConfig, type Transform } from '@graphql-tools/delegate';
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
        const config = this.getConfig(typeName, fieldName);
        if (!config) {
            return fieldConfig;
        }

        let newFieldConfig = fieldConfig;
        for (const modifier of config.replacers) {
            if (!(modifier instanceof BaseReplacer)) {
                continue;
            }

            newFieldConfig = modifier.modifySchema(newFieldConfig, fieldType);
        }

        return newFieldConfig;
    }

    private getConfig(
        typeName: string,
        fieldName: string,
    ): ReplaceConfigTransformConfig | undefined {
        return this.configs?.find(
            config => config.typeName === typeName && config.fields.includes(fieldName),
        );
    }
}
