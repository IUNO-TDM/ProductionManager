import {Component, OnInit} from '@angular/core';
import {TitleService} from '../../services/title.service';
import {ObjectService} from '../../services/object.service';
import {MachineService} from '../../services/machine.service';
import {MachineType} from '../../models/machineType';
import {ShoppingCartService} from '../../services/shopping-cart.service';
import {Router, ActivatedRoute} from '@angular/router';
import {OrderService} from '../../services/order.service';
import {Filter} from '../../models/filter';
import {MaterialService} from '../../services/material.service';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material';
import {MaterialDefinition} from '../../models/materialDefinition';
import {FlatTreeControl} from '@angular/cdk/tree';
import {SelectionChange, SelectionModel} from '@angular/cdk/collections';
import {debounceTime} from 'rxjs/operators';

export class MaterialDefinitionFlat {
    name: string;
    description: string;
    id: string;
    displayColor: string;
    attributes: Array<{ id: string, name: string }>;
    expandable: boolean;
    level: number;
}

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrls: ['./marketplace.component.css']
})

export class MarketplaceComponent implements OnInit {
    objects: any[] = [];
    selectedObject: any = null;
    selectedObjectId: string = null;
    machineTypes: MachineType[] = [];
    machineTypesSelected = [];
    searchQuery = '';
    shoppingCartItemCount = 0;
    loading = true;

    materialHierarchic = [];


    materialDataSource: MatTreeFlatDataSource<MaterialDefinition, MaterialDefinitionFlat>;
    materialTreeControl: FlatTreeControl<MaterialDefinitionFlat>;
    materialTreeFlattener: MatTreeFlattener<MaterialDefinition, MaterialDefinitionFlat>;
    materialFlatNodeMap = new Map<MaterialDefinitionFlat, MaterialDefinition>();
    materialNestedNodeMap = new Map<MaterialDefinition, MaterialDefinitionFlat>();
    /** The selection for checklist */
    checklistSelection = new SelectionModel<MaterialDefinitionFlat>(true /* multiple */);

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private titleService: TitleService,
        private objectService: ObjectService,
        private machineService: MachineService,
        private materialService: MaterialService,
        private orderService: OrderService,
        private shoppingCartService: ShoppingCartService,
    ) {
        this.materialTreeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.materialTreeControl = new FlatTreeControl<MaterialDefinitionFlat>(this.getLevel, this.isExpandable);
        this.materialDataSource = new MatTreeFlatDataSource(this.materialTreeControl, this.materialTreeFlattener);
        route.params.subscribe(params => {
            this.selectedObjectId = params['id']
            })
    }

    getLevel = (node: MaterialDefinitionFlat) => node.level;

    isExpandable = (node: MaterialDefinitionFlat) => node.expandable;

    getChildren = (node: MaterialDefinition): MaterialDefinition[] => node.children;

    hasChild = (_: number, _nodeData: MaterialDefinitionFlat) => _nodeData.expandable;

    /**
     * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
     */
    transformer = (node: MaterialDefinition, level: number) => {
        const existingNode = this.materialNestedNodeMap.get(node);
        const flatNode = existingNode && existingNode.id === node.id
            ? existingNode
            : new MaterialDefinitionFlat();
        flatNode.attributes = node.attributes;
        flatNode.description = node.description;
        flatNode.displayColor = node.displayColor;
        flatNode.id = node.id;
        flatNode.name = node.name;
        flatNode.level = level;
        flatNode.expandable = !!node.children;
        this.materialFlatNodeMap.set(flatNode, node);
        this.materialNestedNodeMap.set(node, flatNode);
        this.checklistSelection.select(flatNode);
        return flatNode;
    }

    /** Whether all the descendants of the node are selected */
    descendantsAllSelected(node: MaterialDefinitionFlat): boolean {
        const descendants = this.materialTreeControl.getDescendants(node);
        return descendants.every(child => this.checklistSelection.isSelected(child));
    }

    /** Whether part of the descendants are selected */
    descendantsPartiallySelected(node: MaterialDefinitionFlat): boolean {
        const descendants = this.materialTreeControl.getDescendants(node);
        const result = descendants.some(child => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    }

    /** Toggle the to-do item selection. Select/deselect all the descendants node */
    materialItemSelectionToggle(node: MaterialDefinitionFlat): void {
        this.checklistSelection.toggle(node);
        const descendants = this.materialTreeControl.getDescendants(node);
        this.checklistSelection.isSelected(node)
            ? this.checklistSelection.select(...descendants)
            : this.checklistSelection.deselect(...descendants);
    }


    ngOnInit() {
        // check if open orders exist. If yes, marketplace view is deaktivated and order must be completed or canceled.
        this.orderService.getOpenOrders().subscribe(orders => {
            if (orders.length > 0) {
                this.router.navigateByUrl('marketplace/order');
            } else {
                this.initMarketplaceComponent();
            }
        });
    }

    private initMarketplaceComponent() {
        this.machineService.getMachineTypes().subscribe(machineTypes => {
            this.machineTypesSelected = machineTypes.map(machineType => machineType.id);
            this.machineTypes = machineTypes;
            this.updateObjects();
        });

        this.materialService.getAllMaterials(true).subscribe(materials => {
            this.materialHierarchic = materials;
            this.materialDataSource.data = materials;
            this.checklistSelection.onChange.pipe(debounceTime(1000)).subscribe((change: SelectionChange<MaterialDefinitionFlat>) => {
                this.updateObjects();
            });

            this.updateObjects();
        });
        this.shoppingCartService.items.subscribe(items => {
            this.shoppingCartItemCount = items.map(item => item.amount).reduce((sum, itemCount) => sum + itemCount, 0);
        });
    }

    onAddToShoppingCartClicked() {
        this.shoppingCartService.addToShoppingCart(this.selectedObjectId).subscribe(result => {
            //TODO: handle return value
        });
    }

    onShoppingCartClicked() {
        this.router.navigateByUrl('marketplace/shoppingcart');
    }

    onSearchQueryChanged() {
        this.updateObjects();
    }

    onObjectSelected(object) {
        this.router.navigateByUrl('marketplace/' + object.id);
        // this.selectedObject = object;
    }

    deselectObject() {
        this.router.navigateByUrl('marketplace/');
    }

    /**
     * Is called if a machineType's checkbox was changed.
     * It adds or removes the machineType id to or from the array of selected machinetypes depending
     * on the checked state of the checkbox.
     * @param id id to add or remove
     * @param checked if the checkbox is checked.
     * @returns
     */
    onMachineTypeCheckboxChanged(id, checked) {
        if (checked) {
            if (this.machineTypesSelected.indexOf(id) === -1) {
                this.machineTypesSelected.push(id);
            }
        } else {
            this.machineTypesSelected = this.machineTypesSelected.filter(type => {
                return type !== id;
            });
        }
        this.updateObjects();
    }

    /**
     * Returns the selected state of a machineType's id.
     * It is used for the checkboxes to query their state.
     * @param id id to check
     * @returns true if the machineType id is in the array of selected machinetypes, false if not
     */
    isMachineTypeSelected(id): boolean {
        return this.machineTypesSelected.indexOf(id) !== -1;
    }

    // /**
    //  * Is called if a material's checkbox was changed.
    //  * It adds or removes the material's id to or from the array of selected materials depending
    //  * on the checked state of the checkbox.
    //  * @param id id to add or remove
    //  * @param checked if the checkbox is checked.
    //  * @returns
    //  */
    // onMaterialCheckboxChanged(id, checked) {
    //     if (checked) {
    //         if (this.materialsSelected.indexOf(id) === -1) {
    //             this.materialsSelected.push(id);
    //         }
    //     } else {
    //         this.materialsSelected = this.materialsSelected.filter(material => {
    //             return material !== id;
    //         });
    //     }
    //     this.updateObjects();
    // }

    // /**
    //  * Returns the selected state of a materials's id.
    //  * It is used for the checkboxes to query their state.
    //  * @param id id to check
    //  * @returns true if the materials id is in the array of selected materials, false if not
    //  */
    // isMaterialSelected(id): boolean {
    //     return this.materialsSelected.indexOf(id) !== -1;
    // }


    /**
     * Fetches all objects from backend which matches to the selected machinetypes and materials.
     * If no machinetype is selected, all machinetypes are queried.
     * If no material is selected, all materials are queried.
     * @returns
     */
    private updateObjects() {
        if (this.machineTypes.length > 0 && this.materialHierarchic.length > 0) {

            // setup machine type array
            let machineTypeIds = this.machineTypesSelected;
            if (machineTypeIds.length === 0) {
                machineTypeIds = this.machineTypes.map(machineType => machineType.id);
            }

            // setup material type array
            let materialIds = this.checklistSelection.selected.map(materialFlat => materialFlat.id)
            // let materialIds = [];
            // if (materialIds.length === 0) {
            //     materialIds = this.materials.map(material => material.id);
            // }


            const filter = new Filter();
            filter.lang = 'de';
            filter.purchased = false;
            filter.materials = materialIds;
            filter.machines = machineTypeIds;

            this.objectService.createFilter(filter).subscribe((filterId) => {
                this.objectService.getObjects(filterId).subscribe(objects => {
                    this.selectedObject = objects.find(o => {
                        return o.id === this.selectedObjectId
                    })
                    if (this.searchQuery.length > 0) {
                        this.objects = objects.filter(object => {
                            let include = false;
                            include = include || object.name.toUpperCase().indexOf(this.searchQuery.toUpperCase()) !== -1;
                            include = include || object.description.toUpperCase().indexOf(this.searchQuery.toUpperCase()) !== -1;
                            return include;
                        });
                    } else {
                        this.objects = objects;
                    }
                    this.loading = false;
                });
            }, err => {
                console.log(err);
            });

            // perform query

        } else {
            this.objects = [];
        }
    }

    ngAfterViewInit() {
        this.titleService.setTitle('Marktplatz');
    }
}
