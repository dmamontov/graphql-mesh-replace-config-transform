import {
    type GraphQLEnumValueConfig,
    type GraphQLFieldConfig,
    type GraphQLInputFieldConfig,
} from 'graphql';
import { type GraphQLArgumentConfig } from 'graphql/type/definition';
import { type BaseReplacer } from './replacers/base';

export interface ReplaceConfigTransformConfig {
    typeName: string;
    fields?: string[];
    replacers: ReplaceConfigReplacersTransformConfig[];
}

export type ReplaceConfigReplacersTransformConfig =
    | ReplaceConfigReplacerDescriptionTransformConfig
    | ReplaceConfigReplacerTypeTransformConfig
    | ReplaceConfigReplacerDeprecatedTransformConfig
    | ReplaceConfigReplacerNullableTransformConfig
    | ReplaceConfigReplacerDefaultTransformConfig
    | ReplaceConfigReplacerExtensionsTransformConfig
    | ReplaceConfigReplacerDirectiveTransformConfig
    | BaseReplacer;

export interface ReplaceConfigReplacerDescriptionTransformConfig {
    description: string | boolean;
}

export interface ReplaceConfigReplacerTypeTransformConfig {
    type: string;
}

export interface ReplaceConfigReplacerDeprecatedTransformConfig {
    deprecated: string | boolean;
}

export interface ReplaceConfigReplacerNullableTransformConfig {
    nullable: boolean;
}

export interface ReplaceConfigReplacerDefaultTransformConfig {
    default: any;
}

export interface ReplaceConfigReplacerExtensionsTransformConfig {
    extensions: Record<string, any>;
}

export interface ReplaceConfigReplacerDirectiveTransformConfig {
    directive: string;
    args?: Record<string, any>;
}

export enum FieldType {
    Composite,
    Input,
    Enum,
    Argument,
}

export type ReplaceFieldConfig =
    | GraphQLFieldConfig<any, any>
    | GraphQLInputFieldConfig
    | GraphQLEnumValueConfig
    | GraphQLArgumentConfig;
