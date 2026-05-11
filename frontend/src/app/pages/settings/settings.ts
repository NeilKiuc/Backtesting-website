import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data-service';

type CategoryId = 'compte' | 'apparence' | 'notifications' | 'securite' | 'confidentialite' | 'danger';

interface Category {
  id: CategoryId;
  label: string;
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
  theme: 'dark',
  notifications: true,
  emailUpdates: false,
  privacy: 'private',
};

@Component({
  selector: 'app-settings',
  imports: [FormsModule, MatSnackBarModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private snackBar = inject(MatSnackBar);
  private auth     = inject(AuthService);
  private dataService = inject(DataService);

  languages = ['Français', 'English', 'Español'];

  categories: Category[] = [
    { id: 'compte',          label: 'Compte' },
    { id: 'apparence',       label: 'Apparence' },
    { id: 'notifications',   label: 'Notifications' },
    { id: 'securite',        label: 'Sécurité' },
    { id: 'confidentialite', label: 'Confidentialité' },
    { id: 'danger',          label: 'Zone de danger' },
  ];

  activeCategory: CategoryId = 'compte';
  model: SettingsModel       = structuredClone(DEFAULT_MODEL);
  initialModel: SettingsModel = structuredClone(DEFAULT_MODEL);
  hasChanges = false;
  saving = false;

  ngOnInit() {
    const user = this.auth.getUser();
    if (user) {
      this.model.username = user.username;
      this.model.email    = user.email;
    }

    const raw = localStorage.getItem('app-settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SettingsModel>;
        const { username, email, ...prefs } = parsed;
        this.model = { ...this.model, ...prefs };
      } catch { /* ignore */ }
    }

    this.initialModel = structuredClone(this.model);
    this.applyTheme(this.model.theme);
  }

  selectCategory(cat: CategoryId) { this.activeCategory = cat; }

  onModelChange() {
    this.hasChanges = JSON.stringify(this.model) !== JSON.stringify(this.initialModel);
    if (this.model.theme !== this.initialModel.theme) this.applyTheme(this.model.theme);
  }

  setTheme(theme: 'light' | 'dark') {
    this.model.theme = theme;
    this.onModelChange();
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }

  saveSettings() {
    if (!this.hasChanges) return;
    const user = this.auth.getUser();

    if (user && this.model.username !== this.initialModel.username) {
      this.saving = true;
      this.dataService.updateUsername(user.id, this.model.username).subscribe({
        next: (updated) => {
          this.auth.saveUser({ ...user, username: updated.username });
          this.saving = false;
          this.finalizeSave();
        },
        error: (err) => {
          this.saving = false;
          const detail = err?.error?.detail ?? 'Erreur lors de la sauvegarde.';
          this.snackBar.open(detail, 'Fermer', { duration: 4000 });
        },
      });
    } else {
      this.finalizeSave();
    }
  }

  private finalizeSave() {
    const { username, email, ...prefs } = this.model;
    localStorage.setItem('app-settings', JSON.stringify(prefs));
    this.initialModel = structuredClone(this.model);
    this.hasChanges = false;
    this.snackBar.open('Paramètres enregistrés', 'Fermer', { duration: 3000 });
  }

  resetSettings() {
    localStorage.removeItem('app-settings');
    const user = this.auth.getUser();
    this.model = {
      ...structuredClone(DEFAULT_MODEL),
      username: user?.username ?? '',
      email:    user?.email    ?? '',
    };
    this.initialModel = structuredClone(this.model);
    this.hasChanges = false;
    this.applyTheme('dark');
    this.snackBar.open('Paramètres réinitialisés', 'Fermer', { duration: 3000 });
  }

  deleteAccount() {
    const user = this.auth.getUser();
    if (!user) { this.auth.logout(); return; }

    const confirmed = confirm(
      'Êtes-vous certain ? Cette action est IRRÉVERSIBLE et supprimera définitivement votre compte et toutes vos données.'
    );
    if (!confirmed) return;

    this.dataService.deleteAccount(user.id).subscribe({
      next: () => {
        this.snackBar.open('Compte supprimé.', 'Fermer', { duration: 3000 });
        this.auth.logout();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 4000 });
      },
    });
  }
}
