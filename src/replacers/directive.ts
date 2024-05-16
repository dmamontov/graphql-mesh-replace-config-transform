import { Kind, type ConstDirectiveNode, type ConstValueNode } from 'graphql';
import {
    type FieldType,
    type ReplaceConfigReplacerDirectiveTransformConfig,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class DirectiveReplacer extends BaseReplacer {
    modifySchema(fieldConfig: ReplaceFieldConfig, _type: FieldType): ReplaceFieldConfig {
        const options = this.options as ReplaceConfigReplacerDirectiveTransformConfig;

        let newFieldConfig = fieldConfig;

        if (!newFieldConfig.astNode) {
            // @ts-expect-error
            newFieldConfig.astNode = {};
        }

        if (!newFieldConfig?.astNode?.directives) {
            (newFieldConfig.astNode as any).directives = [];
        }

        // @ts-expect-error
        newFieldConfig.astNode.directives.push({
            kind: Kind.DIRECTIVE,
            name: {
                kind: Kind.NAME,
                value: options.directive,
            },
            arguments: Object.entries(options.args || {}).map(([name, arg]) => ({
                kind: Kind.ARGUMENT,
                name: { kind: Kind.NAME, value: name },
                value: this.getValueNode(arg),
            })),
        } as ConstDirectiveNode);

        return newFieldConfig;
    }

    private getValueNode(value: any): ConstValueNode {
        if (typeof value == 'boolean') {
            return {
                kind: Kind.BOOLEAN,
                value: value,
            };
        }

        if (!value || value === 'null') {
            return {
                kind: Kind.NULL,
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
}

export const createDirectiveReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new DirectiveReplacer(options);
};
