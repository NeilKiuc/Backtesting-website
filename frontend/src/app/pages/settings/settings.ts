import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data-service';

type CategoryId = 'compte' | 'apparence' | 'notifications' | 'securite' | 'confidentialite' | 'danger';

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
  theme: 'dark',
  notifications: true,
  emailUpdates: false,
  privacy: 'private',
};

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    MatButtonModule, MatSlideToggleModule, MatSelectModule,
    MatInputModule, MatFormFieldModule, MatCardModule,
    MatDividerModule, MatIconModule, MatSnackBarModule,
    MatTooltipModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private snackBar = inject(MatSnackBar);
  private auth     = inject(AuthService);
  private dataService = inject(DataService);

  languages = ['Français', 'English', 'Español'];

  categories: Category[] = [
    { id: 'compte',          label: 'Compte',          icon: 'person'       },
    { id: 'apparence',       label: 'Apparence',       icon: 'palette'      },
    { id: 'notifications',   label: 'Notifications',   icon: 'notifications' },
    { id: 'securite',        label: 'Sécurité',        icon: 'security'     },
    { id: 'confidentialite', label: 'Confidentialité', icon: 'privacy_tip'  },
    { id: 'danger',          label: 'Zone de danger',  icon: 'warning'      },
  ];

  activeCategory: CategoryId = 'compte';
  model: SettingsModel       = structuredClone(DEFAULT_MODEL);
  initialModel: SettingsModel = structuredClone(DEFAULT_MODEL);
  hasChanges = false;
  saving = false;

  ngOnInit() {
    // Pré-remplir depuis le user connecté
    const user = this.auth.getUser();
    if (user) {
      this.model.username = user.username;
      this.model.email    = user.email;
    }

    // Charger les préférences locales (thème, langue, etc.)
    const raw = localStorage.getItem('app-settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SettingsModel>;
        // On garde le username/email du user connecté, pas celui du localStorage
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

    // Si username a changé et user connecté → sauvegarde en BDD
    if (user && this.model.username !== this.initialModel.username) {
      this.saving = true;
      this.dataService.updateUsername(user.id, this.model.username).subscribe({
        next: (updated) => {
          // Met à jour le localStorage auth avec le nouveau username
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
    // Sauvegarde les préférences locales (thème, langue, etc.)
    const { username, email, ...prefs } = this.model;
    localStorage.setItem('app-settings', JSON.stringify(prefs));
    this.initialModel = structuredClone(this.model);
    this.hasChanges = false;
    this.snackBar.open('Paramètres enregistrés ✓', 'Fermer', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
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
