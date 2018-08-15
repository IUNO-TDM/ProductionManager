//FIXME: Replace me by TdmObjectPrinterObject of tdm-commons. Current problem is that tdm-commons is not working with angular 6 ;-(.
export class TdmObject {
    id: string;
    name: string;
    description: string;
    licenseFee: number;
    productCode: number;
    backgroundColor: string;
    // components
    materials: Array<any>;
    machines: Array<any>;
}
