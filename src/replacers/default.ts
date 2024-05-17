import {
    FieldType,
    type ReplaceConfigReplacerDefaultTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class DefaultReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, type: FieldType): ReplaceFieldConfig {
        const defaultValue = (this.options as ReplaceConfigReplacerDefaultTransformConfig).default;

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
