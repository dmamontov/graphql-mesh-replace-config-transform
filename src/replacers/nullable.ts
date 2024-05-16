import { GraphQLNonNull, isNonNullType } from 'graphql';
import {
    FieldType,
    type ReplaceConfigReplacerNullableTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class NullableReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, type: FieldType): ReplaceFieldConfig {
        const nullable = (this.options as ReplaceConfigReplacerNullableTransformConfig).nullable;

        if (![FieldType.Composite, FieldType.Input].includes(type)) {
            throw new TypeError('Nullable can only be set for InputField and Field.');
        }

        let newFieldConfig: any = fieldConfig;
        if (nullable && isNonNullType(newFieldConfig.type)) {
            newFieldConfig = {
                ...newFieldConfig,
                type: newFieldConfig.type.ofType,
            };
        } else if (!nullable && !isNonNullType(newFieldConfig.type)) {
            newFieldConfig = {
                ...newFieldConfig,
                type: new GraphQLNonNull(newFieldConfig.type),
            };
        }

        return {
            ...newFieldConfig,
            extensions: {
                ...newFieldConfig.extensions,
                nullable,
            },
        };
    }
}

export const createNullableReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new NullableReplacer(options);
};
