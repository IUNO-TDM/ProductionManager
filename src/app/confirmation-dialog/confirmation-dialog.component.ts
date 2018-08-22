import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent implements OnInit {
    public title: string;
    public message: string;
    public leftButtonText: string;
    public rightButtonText: string;

    constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>) {
    }

    ngOnInit() {
    }

}
