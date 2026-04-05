import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { StrategyService, StrategyStatus, StrategyType } from '../../services/strategy.service';

const TYPE_COLOR: Record<StrategyType, string> = {
  trend:          '#4CAF50',
  mean_reversion: '#2196F3',
  momentum:       '#FF9800',
  other:          '#9C27B0',
};

const TYPE_ICON: Record<StrategyType, string> = {
  trend:          'trending_up',
  mean_reversion: 'swap_horiz',
  momentum:       'bolt',
  other:          'functions',
};

type FilterKey = 'all' | StrategyStatus;

@Component({
  selector: 'app-strategies-card',
  imports: [MatIconModule, MatIconButton, RouterLink, DecimalPipe],
  templateUrl: './strategies-card.html',
  styleUrl: './strategies-card.scss',
})
export class StrategiesCard {
  private strategyService = inject(StrategyService);

  activeFilter: FilterKey = 'all';

  filters: { key: FilterKey; label: string }[] = [
    { key: 'all',    label: 'Toutes'    },
    { key: 'active', label: 'Actives'   },
    { key: 'paused', label: 'En pause'  },
    { key: 'draft',  label: 'Brouillons'},
  ];

  get strategies() {
    return this.strategyService.getFavorites();
  }

  get filteredStrategies() {
    if (this.activeFilter === 'all') return this.strategies;
    return this.strategies.filter(s => s.status === this.activeFilter);
  }

  countByStatus(key: FilterKey): number {
    if (key === 'all') return this.strategies.length;
    return this.strategies.filter(s => s.status === key).length;
  }

  setFilter(key: FilterKey) {
    this.activeFilter = key;
  }

  typeColor(type: StrategyType): string {
    return TYPE_COLOR[type];
  }

  typeIcon(type: StrategyType): string {
    return TYPE_ICON[type];
  }
}
