import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {TitleService} from './services/title.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'app';
    navigationTitle = 't';

    constructor(
        private router: Router,
        private titleService: TitleService
    ) {
        titleService.title.subscribe(title => {
            this.navigationTitle = title;
        });
    }
}

