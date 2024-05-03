export interface ReplaceConfigTransformConfig {
    typeName: string;
    fieldName: string;
    description?: string;
    deprecated?: boolean;
    nullable?: boolean;
    defaultValue?: unknown;
    extensions?: Record<string, any>;
    directives?: ReplaceConfigDirectiveConfig[];
}

export interface ReplaceConfigDirectiveConfig {
    name: string;
    args?: Record<string, any>;
}

export enum FieldType {
    Composite,
    Input,
    Enum,
}
