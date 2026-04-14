import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    // Redirige vers dashboard si déjà connecté
    this.auth.isAuthenticated().subscribe((ok) => {
      if (ok) this.router.navigate(['/dashboard']);
    });
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/api/auth/login`;
  }

  enterDemo() {
    this.auth.setDemoMode();
    this.router.navigate(['/dashboard']);
  }
}
