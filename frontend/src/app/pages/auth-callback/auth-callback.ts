import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '',
})
export class AuthCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    if (params['user_id']) {
      this.auth.saveUser({
        id: +params['user_id'],
        username: params['username'],
        email: params['email'],
      });
    }
    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }
}
