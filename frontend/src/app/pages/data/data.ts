import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';

@Component({
  selector: 'app-data',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './data.html',
  styleUrl: './data.scss',
})
export class Data {
  private selectedDataBase: string = '';
}
