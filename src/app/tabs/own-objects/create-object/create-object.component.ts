import {Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material';
import {ConfirmationDialogComponent} from '../../../confirmation-dialog/confirmation-dialog.component';
import {Router} from '@angular/router';

@Component({
    selector: 'app-create-object',
    templateUrl: './create-object.component.html',
    styleUrls: ['./create-object.component.css']
})
export class CreateObjectComponent implements OnInit {
    confirmationDialogRef: MatDialogRef<ConfirmationDialogComponent>;

    constructor(
        public dialog: MatDialog,
        private router: Router
    ) {
    }

    ngOnInit() {
    }

    onCancelClicked() {
        this.confirmationDialogRef = this.dialog.open(ConfirmationDialogComponent, {});
        this.confirmationDialogRef.componentInstance.title = 'Entwurf löschen?';
        this.confirmationDialogRef.componentInstance.message = 'Möchten Sie die Bearbeitung wirklich abbrechen?';
        this.confirmationDialogRef.componentInstance.leftButtonText = 'Zurück';
        this.confirmationDialogRef.componentInstance.rightButtonText = 'Entwurf löschen';

        this.confirmationDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.router.navigateByUrl('own-objects');
            }
            this.confirmationDialogRef = null;
        });
    }

    onSaveClicked() {

    }

}
