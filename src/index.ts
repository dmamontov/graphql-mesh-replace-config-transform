import {
    GraphQLNonNull,
    Kind,
    type ConstDirectiveNode,
    type ConstValueNode,
    type GraphQLEnumValueConfig,
    type GraphQLFieldConfig,
    type GraphQLInputFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import {
    applyRequestTransforms,
    applyResultTransforms,
    applySchemaTransforms,
} from '@graphql-mesh/utils';
import {
    type DelegationContext,
    type SubschemaConfig,
    type Transform,
} from '@graphql-tools/delegate';
import { type ExecutionRequest, type ExecutionResult } from '@graphql-tools/utils';
import {
    TransformCompositeFields,
    TransformEnumValues,
    TransformInputObjectFields,
} from '@graphql-tools/wrap';
import {
    FieldType,
    type ReplaceConfigDirectiveConfig,
    type ReplaceConfigTransformConfig,
} from './types';

export default class ReplaceConfigTransform implements Transform {
    public noWrap: boolean = false;
    private readonly configs: ReplaceConfigTransformConfig[];
    private readonly transformers: Array<
        TransformCompositeFields | TransformInputObjectFields | TransformEnumValues
    >;

    constructor({ config }: { config: ReplaceConfigTransformConfig[] }) {
        this.configs = config;
        this.transformers = [
            new TransformCompositeFields(
                (
                    typeName: string,
                    fieldName: string,
                    fieldConfig: GraphQLFieldConfig<any, any>,
                ): GraphQLFieldConfig<any, any> =>
                    this.apply(
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
                    this.apply(
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
                    this.apply(
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
        return applySchemaTransforms(
            originalWrappingSchema,
            subschemaConfig,
            transformedSchema,
            this.transformers,
        );
    }

    public transformRequest(
        originalRequest: ExecutionRequest,
        delegationContext: DelegationContext,
        transformationContext: any,
    ): ExecutionRequest {
        return applyRequestTransforms(
            originalRequest,
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    transformResult(
        originalResult: ExecutionResult,
        delegationContext: DelegationContext,
        transformationContext: any,
    ) {
        return applyResultTransforms(
            originalResult,
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    private apply(
        typeName: string,
        fieldName: string,
        fieldConfig:
            | GraphQLFieldConfig<any, any>
            | GraphQLInputFieldConfig
            | GraphQLEnumValueConfig,
        fieldType: FieldType,
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig | GraphQLEnumValueConfig {
        const replaceConfigs = this.getConfigs(typeName, fieldName);

        let newFieldConfig = fieldConfig;
        for (const replaceConfig of replaceConfigs) {
            if (replaceConfig.description) {
                newFieldConfig = this.setDescription(newFieldConfig, replaceConfig.description);
            }

            if (replaceConfig.deprecated !== undefined) {
                newFieldConfig = this.setDeprecated(newFieldConfig, replaceConfig.deprecated);
            }

            if (replaceConfig.nullable !== undefined) {
                if (![FieldType.Composite, FieldType.Input].includes(fieldType)) {
                    throw new Error('Nullable can only be set for InputField and Field.');
                }

                // @ts-expect-error
                newFieldConfig = this.setNullable(newFieldConfig, replaceConfig.nullable);
            }

            if (replaceConfig.defaultValue) {
                if (fieldType !== FieldType.Input) {
                    throw new Error('The default value can only be set for InputField.');
                }

                newFieldConfig = this.setDefaultValue(
                    newFieldConfig as GraphQLInputFieldConfig,
                    replaceConfig.defaultValue,
                );
            }

            if (
                replaceConfig.extensions !== undefined &&
                Object.keys(replaceConfig.extensions).length > 0
            ) {
                newFieldConfig = this.setExtensions(newFieldConfig, replaceConfig.extensions);
            }

            if (
                replaceConfig.directives !== undefined &&
                Object.keys(replaceConfig.directives).length > 0
            ) {
                newFieldConfig = this.setDirectives(newFieldConfig, replaceConfig.directives);
            }
        }

        return newFieldConfig;
    }

    setDescription(
        fieldConfig:
            | GraphQLFieldConfig<any, any>
            | GraphQLInputFieldConfig
            | GraphQLEnumValueConfig,
        description: string,
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig | GraphQLEnumValueConfig {
        return {
            ...fieldConfig,
            description,
            extensions: {
                ...fieldConfig.extensions,
                isCustomDescriptions: true,
            },
        };
    }

    setDeprecated(
        fieldConfig:
            | GraphQLFieldConfig<any, any>
            | GraphQLInputFieldConfig
            | GraphQLEnumValueConfig,
        deprecated: boolean,
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig | GraphQLEnumValueConfig {
        return {
            ...fieldConfig,
            deprecationReason: deprecated ? 'deprecated' : null,
        };
    }

    setNullable(
        fieldConfig: GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig,
        nullable: boolean,
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig {
        let newFieldConfig = fieldConfig;
        if (nullable && newFieldConfig.type instanceof GraphQLNonNull) {
            newFieldConfig = {
                ...newFieldConfig,
                type: newFieldConfig.type.ofType,
            } as any;
        } else if (!nullable && !(newFieldConfig.type instanceof GraphQLNonNull)) {
            newFieldConfig = {
                ...newFieldConfig,
                type: new GraphQLNonNull(newFieldConfig.type),
            } as any;
        }

        return {
            ...newFieldConfig,
            extensions: {
                ...newFieldConfig.extensions,
                nullable,
            },
        };
    }

    setDefaultValue(fieldConfig: GraphQLInputFieldConfig, value: any) {
        return {
            ...fieldConfig,
            defaultValue: value,
        } as GraphQLInputFieldConfig;
    }

    setExtensions(
        fieldConfig:
            | GraphQLFieldConfig<any, any>
            | GraphQLInputFieldConfig
            | GraphQLEnumValueConfig,
        extensions: Record<string, any>,
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig | GraphQLEnumValueConfig {
        return {
            ...fieldConfig,
            extensions: {
                ...fieldConfig.extensions,
                ...extensions,
            },
        };
    }

    setDirectives(
        fieldConfig:
            | GraphQLFieldConfig<any, any>
            | GraphQLInputFieldConfig
            | GraphQLEnumValueConfig,
        directives: ReplaceConfigDirectiveConfig[],
    ): GraphQLFieldConfig<any, any> | GraphQLInputFieldConfig | GraphQLEnumValueConfig {
        let newFieldConfig = fieldConfig;

        for (const directive of directives) {
            if (!newFieldConfig.astNode) {
                // @ts-expect-error
                newFieldConfig.astNode = {};
            }

            if (!newFieldConfig?.astNode?.directives) {
                // @ts-expect-error
                newFieldConfig.astNode.directives = [];
            }

            // @ts-expect-error
            newFieldConfig.astNode.directives.push({
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: directive.name,
                },
                arguments: Object.entries(directive.args || {}).map(([name, arg]) => ({
                    kind: Kind.ARGUMENT,
                    name: { kind: Kind.NAME, value: name },
                    value: this.getValueNode(arg),
                })),
            } as ConstDirectiveNode);
        }

        return newFieldConfig;
    }

    getValueNode(value: any): ConstValueNode {
        if (!value) {
            return {
                kind: Kind.NULL,
            };
        }

        if (typeof value == 'boolean') {
            return {
                kind: Kind.BOOLEAN,
                value: value,
            };
        }

        if (!isNaN(Number(value))) {
            if (value % 1 === 0) {
                return {
                    kind: Kind.INT,
                    value: value.toString(),
                };
            }
            if (value % 1 !== 0) {
                return {
                    kind: Kind.FLOAT,
                    value: value.toString(),
                };
            }
        }

        if (typeof value == 'object' || Array.isArray(value)) {
            return {
                kind: Kind.STRING,
                value: JSON.stringify(value),
            };
        }

        return {
            kind: Kind.STRING,
            value: value.toString(),
        };
    }

    getConfigs(typeName: string, fieldName: string) {
        return this.configs.filter(
            replaceConfig =>
                replaceConfig.typeName === typeName && replaceConfig.fieldName === fieldName,
        );
    }
}
