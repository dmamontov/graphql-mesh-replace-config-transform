import {
    type FieldType,
    type ReplaceConfigReplacerDescriptionTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class DescriptionReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, _type: FieldType): ReplaceFieldConfig {
        const description = (this.options as ReplaceConfigReplacerDescriptionTransformConfig)
            .description;
        if (!description) {
            return {
                ...fieldConfig,
                description: null,
            };
        }

        if (typeof description == 'boolean') {
            throw new TypeError('Description can only be false or a string.');
        }

        return {
            ...fieldConfig,
            description,
            extensions: {
                ...fieldConfig.extensions,
                description,
            },
        };
    }
}

export const createDescriptionReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new DescriptionReplacer(options);
};
