import { Component, OnInit } from '@angular/core';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  ngOnInit() {
    // Le thème est enregistré par la page Settings dans la clé 'app-settings'
    // (objet JSON). Défaut : sombre (l'application est conçue dark-first).
    let theme: 'light' | 'dark' = 'dark';
    try {
      const raw = localStorage.getItem('app-settings');
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs?.theme === 'light' || prefs?.theme === 'dark') {
          theme = prefs.theme;
        }
      }
    } catch {
      /* app-settings corrompu : on garde le défaut sombre */
    }

    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.documentElement.classList.toggle('dark-theme', isDark);
  }
}
