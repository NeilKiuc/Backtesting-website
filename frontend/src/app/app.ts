import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Navbar } from './components/navbar/navbar';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule, MatSlideToggleModule, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
