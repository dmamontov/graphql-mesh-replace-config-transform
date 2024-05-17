import { stringInterpolator } from '@graphql-mesh/string-interpolation';
import {
    FieldType,
    type ReplaceConfigReplacerDefaultTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class DefaultReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, type: FieldType): ReplaceFieldConfig {
        let defaultValue = (this.options as ReplaceConfigReplacerDefaultTransformConfig).default;
        if (typeof defaultValue === 'string') {
            defaultValue = stringInterpolator.parse(defaultValue, { env: process.env });
        }

        if (![FieldType.Input, FieldType.Argument].includes(type)) {
            return fieldConfig;
        }

        return {
            ...fieldConfig,
            defaultValue,
        };
    }
}

export const createDefaultReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new DefaultReplacer(options);
};
