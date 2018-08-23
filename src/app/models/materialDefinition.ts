export class MaterialDefinition {
    name: string;
    description: string;
    id: string;
    displayColor: string;
    attributes: Array<{ id: string, name: string }>;
    children: Array<MaterialDefinition>;
}