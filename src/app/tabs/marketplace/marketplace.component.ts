import { Component, OnInit } from '@angular/core';
import { TitleService } from '../../services/title.service';
import { ObjectService } from '../../services/object.service';
import { Machine } from '../../models/machine';
import { MachineService } from '../../services/machine.service';
import { MachineType } from '../../models/machineType';
import { ShoppingCartService } from '../../services/shopping-cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {
  objects: any[] = []
  selectedObject: any = null;
  machineTypes: MachineType[] = []
  machineTypesSelected = []
  materials = []
  materialsSelected = []
  searchQuery = ""
  shoppingCartItemCount = 0

  constructor(
    private router: Router,
    private titleService: TitleService,
    private objectService: ObjectService,
    private machineService: MachineService,
    private shoppingCartService: ShoppingCartService
  ) { }

  ngOnInit() {
    this.machineService.getMachineTypes().subscribe(machineTypes => {
      this.machineTypesSelected = machineTypes.map(machineType => machineType.id)
      this.machineTypes = machineTypes
      this.updateObjects()
    })
    this.machineService.getMaterialTypes().subscribe(materials => {
      this.materialsSelected = materials.map(material => material.id)
      this.materials = materials
      this.updateObjects()
    })
    this.shoppingCartService.items.subscribe(items => {
      this.shoppingCartItemCount = items.map(item => item.amount).reduce((sum, itemCount) => sum + itemCount, 0)
    })
  }

  onAddToShoppingCart(object) {
    this.shoppingCartService.addToShoppingCart(object).subscribe(result => {
      console.log(result)
    })
  }

  onShoppingCartClicked() {
    this.router.navigateByUrl('marketplace/shoppingcart')
  }

  onSearchQueryChanged() {
    this.updateObjects()
  }

  onObjectSelected(object) {
    this.selectedObject = object
  }

  deselectObject() {
    this.selectedObject = null;
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
      if (this.machineTypesSelected.indexOf(id) == -1) {
        this.machineTypesSelected.push(id)
      }
    } else {
      this.machineTypesSelected = this.machineTypesSelected.filter(type => {
        return type !== id
      })
    }
    this.updateObjects()
  }

  /**
   * Returns the selected state of a machineType's id.
   * It is used for the checkboxes to query their state.
   * @param id id to check
   * @returns true if the machineType id is in the array of selected machinetypes, false if not
   */
  isMachineTypeSelected(id): boolean {
    return this.machineTypesSelected.indexOf(id) != -1
  }

  /**
   * Is called if a material's checkbox was changed.
   * It adds or removes the material's id to or from the array of selected materials depending
   * on the checked state of the checkbox.
   * @param id id to add or remove
   * @param checked if the checkbox is checked.
   * @returns 
   */
  onMaterialCheckboxChanged(id, checked) {
    if (checked) {
      if (this.materialsSelected.indexOf(id) == -1) {
        this.materialsSelected.push(id)
      }
    } else {
      this.materialsSelected = this.materialsSelected.filter(material => {
        return material !== id
      })
    }
    this.updateObjects()
  }

  /**
   * Returns the selected state of a materials's id.
   * It is used for the checkboxes to query their state.
   * @param id id to check
   * @returns true if the materials id is in the array of selected materials, false if not
   */
  isMaterialSelected(id): boolean {
    return this.materialsSelected.indexOf(id) != -1
  }

  

  /**
   * Fetches all objects from backend which matches to the selected machinetypes and materials.
   * If no machinetype is selected, all machinetypes are queried.
   * If no material is selected, all materials are queried.
   * @param 
   * @returns 
   */
  private updateObjects() {
    if (this.machineTypes.length > 0 && this.materials.length > 0) {

      // setup machine type array
      var machineTypeIds = this.machineTypesSelected
      if (machineTypeIds.length == 0) {
        machineTypeIds = this.machineTypes.map(machineType => machineType.id)
      }
      
      // setup material type array
      var materialIds = this.materialsSelected
      if (materialIds.length == 0) {
        materialIds = this.materials.map(material => material.id)
      }
      
      // perform query
      this.objectService.getObjects(machineTypeIds, materialIds).subscribe(objects => {
        if (this.searchQuery.length > 0) {
          this.objects = objects.filter(object => {
            var include = false
            include = include || object.name.toUpperCase().indexOf(this.searchQuery.toUpperCase()) != -1
            include = include || object.description.toUpperCase().indexOf(this.searchQuery.toUpperCase()) != -1
            return include
          })
        } else {
          this.objects = objects
        }
      })
    } else {
      this.objects = []
    }
  }

  ngAfterViewInit() {
    this.titleService.setTitle("Marktplatz")
  }
}
