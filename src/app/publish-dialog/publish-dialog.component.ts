import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {LocalObject} from '../models/localObject';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-publish-dialog',
    templateUrl: './publish-dialog.component.html',
    styleUrls: ['./publish-dialog.component.css']
})
export class PublishDialogComponent implements OnInit {
    private localObject: LocalObject;
    private publishInfos: FormGroup;

    constructor(public dialogRef: MatDialogRef<PublishDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any, formBuilder: FormBuilder) {
        this.localObject = data;
        this.publishInfos = formBuilder.group({
            licenseFee: ['', Validators.required],
            title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
            description: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
        });
    }

    ngOnInit() {
    }

    onPublishClicked() {
        this.dialogRef.close(this.publishInfos.value)
    }

    onCancelClicked() {
        this.dialogRef.close(null)
    }
}
