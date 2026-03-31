import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type CategoryId = 'compte' | 'apparence' | 'notifications' | 'securite' | 'danger';

interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

interface SettingsModel {
  language: string;
  username: string;
  email: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  emailUpdates: boolean;
  privacy: 'public' | 'private';
}

const DEFAULT_MODEL: SettingsModel = {
  language: 'Français',
  username: '',
  email: '',
  theme: 'light',
  notifications: true,
  emailUpdates: false,
  privacy: 'private',
};

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  languages = ['Français', 'English', 'Español'];

  categories: Category[] = [
    { id: 'compte', label: 'Compte', icon: 'person' },
    { id: 'apparence', label: 'Apparence', icon: 'palette' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'securite', label: 'Sécurité', icon: 'security' },
    { id: 'danger', label: 'Zone de danger', icon: 'warning' },
  ];

  activeCategory: CategoryId = 'compte';
  model: SettingsModel = structuredClone(DEFAULT_MODEL);
  hasChanges = false;
  initialModel: SettingsModel = structuredClone(DEFAULT_MODEL);

  constructor(private snackBar: MatSnackBar) {
    this.loadSettings();
  }

  loadSettings(): void {
    const raw = localStorage.getItem('app-settings');
    if (!raw) {
      this.applyTheme(this.model.theme);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<SettingsModel>;
      this.model = { ...this.model, ...parsed };
      this.initialModel = structuredClone(this.model);
      this.applyTheme(this.model.theme);
    } catch {
      console.warn('Settings: impossible de charger les paramètres stockés.');
    }
  }

  selectCategory(cat: CategoryId): void {
    this.activeCategory = cat;
  }

  onModelChange(): void {
    this.hasChanges = JSON.stringify(this.model) !== JSON.stringify(this.initialModel);
    if (this.model.theme !== this.initialModel.theme) {
      this.applyTheme(this.model.theme);
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }

  saveSettings(): void {
    if (!this.hasChanges) return;
    localStorage.setItem('app-settings', JSON.stringify(this.model));
    this.initialModel = structuredClone(this.model);
    this.hasChanges = false;
    this.snackBar.open('Paramètres enregistrés', 'Fermer', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  resetSettings(): void {
    localStorage.removeItem('app-settings');
    this.model = structuredClone(DEFAULT_MODEL);
    this.initialModel = structuredClone(DEFAULT_MODEL);
    this.hasChanges = false;
    this.applyTheme('light');
    this.snackBar.open('Paramètres réinitialisés', 'Fermer', {
      duration: 3000,
      panelClass: ['snackbar-info'],
    });
  }

  deleteAccount(): void {
    const confirmed = confirm(
      'Êtes-vous certain ? Cette action est IRRÉVERSIBLE et supprimera définitivement votre compte et toutes vos données.'
    );
    if (confirmed) {
      alert('Compte supprimé (simulation). En production, cela appellerait une API.');
      this.resetSettings();
    }
  }
}
