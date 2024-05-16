import { type GraphQLSchema } from 'graphql';
import {
    type FieldType,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';

export class BaseReplacer {
    protected options: ReplaceConfigReplacersTransformConfig;

    constructor(options: ReplaceConfigReplacersTransformConfig) {
        this.options = options;
    }

    extendScheme(schema: GraphQLSchema): GraphQLSchema {
        return schema;
    }

    modifySchema(fieldConfig: ReplaceFieldConfig, _type: FieldType): ReplaceFieldConfig {
        return fieldConfig;
    }
}

export const createBaseReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new BaseReplacer(options);
};
