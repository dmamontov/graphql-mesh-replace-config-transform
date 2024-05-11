export interface ReplaceConfigTransformConfig {
    typeName: string;
    fieldName: string;
    description?: string | boolean;
    type?: any;
    deprecated?: string | boolean;
    nullable?: boolean;
    defaultValue?: string;
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
