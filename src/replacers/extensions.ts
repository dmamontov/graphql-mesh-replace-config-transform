import {
    type FieldType,
    type ReplaceConfigReplacerExtensionsTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class ExtensionsReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, _type: FieldType): ReplaceFieldConfig {
        const extensions = (this.options as ReplaceConfigReplacerExtensionsTransformConfig)
            .extensions;

        return Object.keys(extensions).length > 0
            ? {
                  ...fieldConfig,
                  extensions: {
                      ...fieldConfig.extensions,
                      ...extensions,
                  },
              }
            : fieldConfig;
    }
}

export const createExtensionsReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new ExtensionsReplacer(options);
};
