import {
    type FieldType,
    type ReplaceConfigReplacerDeprecatedTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class DeprecatedReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, _type: FieldType): ReplaceFieldConfig {
        const deprecated = (this.options as ReplaceConfigReplacerDeprecatedTransformConfig)
            .deprecated;

        return {
            ...fieldConfig,
            deprecationReason: deprecated
                ? typeof deprecated == 'boolean'
                    ? 'Deprecated'
                    : deprecated
                : null,
        };
    }
}

export const createDeprecatedReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new DeprecatedReplacer(options);
};
