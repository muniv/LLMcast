// 예측 모델 인터페이스 및 구현체들

export interface ForecastResult {
  forecasts: Array<{
    day: number;
    predicted_value: number;
    confidence_lower: number;
    confidence_upper: number;
    confidence_level: number;
  }>;
  statistics: {
    model_name: string;
    parameters: Record<string, unknown>;
    fit_quality: number;
    [key: string]: unknown;
  };
}

export interface TrainingData {
  values: number[];
  dates?: string[];
  features?: Record<string, unknown>[];
}

export interface ForecastModel {
  name: string;
  fit(data: TrainingData): void;
  predict(steps: number): ForecastResult;
  validateFit(testData: number[]): {
    mae: number;
    mse: number;
    rmse: number;
    mape: number;
    r2: number;
    accuracy_percentage: number;
  };
}

// ARIMA 모델 구현 (간소화된 버전)
export class ARIMAModel implements ForecastModel {
  protected p: number; // AR order
  protected d: number; // Differencing order
  protected q: number; // MA order
  public name: string = 'ARIMA';
  protected arParams: number[] = [];
  protected maParams: number[] = [];
  protected residuals: number[] = [];
  protected fittedValues: number[] = [];
  protected originalData: number[] = [];
  protected differencedData: number[] = [];
  protected lastOriginalValue: number = 0;

  constructor(p: number = 2, d: number = 1, q: number = 2) {
    this.p = p;
    this.d = d;
    this.q = q;
  }

  fit(data: TrainingData): void {
    this.originalData = [...data.values];
    
    // 1. 차분 적용 (Differencing)
    this.differencedData = this.applyDifferencing(data.values, this.d);
    
    // 2. AR 파라미터 추정 (Yule-Walker 방법 간소화)
    this.arParams = this.estimateARParameters(this.differencedData, this.p);
    
    // 3. MA 파라미터 추정 (간소화된 방법)
    this.maParams = this.estimateMAParameters(this.differencedData, this.q);
    
    // 4. 잔차 계산
    this.calculateResiduals();
  }

  predict(steps: number): ForecastResult {
    const forecasts = [];
    const lastValues = [...this.differencedData.slice(-Math.max(this.p, this.q))];
    const lastResiduals = [...this.residuals.slice(-this.q)];
    
    for (let step = 1; step <= steps; step++) {
      // AR 항 계산
      let arContribution = 0;
      for (let j = 0; j < this.p; j++) {
        if (j < lastValues.length) {
          arContribution += this.arParams[j] * lastValues[lastValues.length - 1 - j];
        }
      }
      
      // MA 항 계산
      let maContribution = 0;
      for (let j = 0; j < this.q; j++) {
        if (j < lastResiduals.length) {
          maContribution += this.maParams[j] * lastResiduals[lastResiduals.length - 1 - j];
        }
      }
      
      const predictedDiff = arContribution + maContribution;
      this.lastOriginalValue = this.originalData[this.originalData.length - 1];
      const predictedValue = Math.max(0, this.lastOriginalValue + predictedDiff);
      
      // 디버깅 로그 추가
      if (step <= 3) {
        console.log(`🔮 ARIMA Prediction Step ${step}:`);
        console.log('  AR contribution:', arContribution);
        console.log('  MA contribution:', maContribution);
        console.log('  Predicted diff:', predictedDiff);
        console.log('  Last original value:', this.lastOriginalValue);
        console.log('  Final predicted value:', predictedValue);
      }
      
      // 신뢰구간 계산 (잔차 표준편차 기반)
      const residualStd = this.calculateStandardDeviation(this.residuals);
      const confidenceInterval = residualStd * Math.sqrt(step) * 1.96; // 95% 신뢰구간
      
      forecasts.push({
        day: step,
        predicted_value: Math.round(predictedValue * 100) / 100,
        confidence_lower: Math.max(0, Math.round((predictedValue - confidenceInterval) * 100) / 100),
        confidence_upper: Math.round((predictedValue + confidenceInterval) * 100) / 100,
        confidence_level: Math.max(0.6, 0.95 - (step * 0.02))
      });
      
      // 다음 예측을 위해 값 업데이트
      lastValues.push(predictedDiff);
      lastResiduals.push(0); // 미래 잔차는 0으로 가정
      
      if (lastValues.length > Math.max(this.p, this.q)) {
        lastValues.shift();
      }
      if (lastResiduals.length > this.q) {
        lastResiduals.shift();
      }
    }

    return {
      forecasts,
      statistics: {
        model_name: `ARIMA(${this.p},${this.d},${this.q})`,
        parameters: {
          ar_params: this.arParams,
          ma_params: this.maParams,
          p: this.p,
          d: this.d,
          q: this.q
        },
        fit_quality: this.calculateFitQuality(),
        residual_std: this.calculateStandardDeviation(this.residuals)
      }
    };
  }

  validateFit(testData: number[]): {
    mae: number;
    mse: number;
    rmse: number;
    mape: number;
    r2: number;
    accuracy_percentage: number;
  } {
    const predictions = this.predict(testData.length);
    const predictedValues = predictions.forecasts.map(f => f.predicted_value);
    
    return this.calculateAccuracyMetrics(testData, predictedValues);
  }

  protected applyDifferencing(data: number[], order: number): number[] {
    let result = [...data];
    
    for (let d = 0; d < order; d++) {
      const diffed = [];
      for (let i = 1; i < result.length; i++) {
        diffed.push(result[i] - result[i - 1]);
      }
      result = diffed;
    }
    
    return result;
  }

  private estimateARParameters(data: number[], order: number): number[] {
    if (data.length < order + 1) return new Array(order).fill(0.1);
    
    // 간소화된 Yule-Walker 방법
    const params = [];
    for (let i = 0; i < order; i++) {
      let numerator = 0;
      let denominator = 0;
      
      for (let t = order; t < data.length; t++) {
        numerator += data[t] * data[t - i - 1];
        denominator += data[t - i - 1] * data[t - i - 1];
      }
      
      params.push(denominator > 0 ? numerator / denominator : 0.1);
    }
    
    return params;
  }

  private estimateMAParameters(data: number[], order: number): number[] {
    // 간소화된 MA 파라미터 추정
    return new Array(order).fill(0.1);
  }

  private calculateResiduals(): void {
    this.residuals = [];
    this.fittedValues = [];
    
    for (let t = Math.max(this.p, this.q); t < this.differencedData.length; t++) {
      let fitted = 0;
      
      // AR 부분
      for (let i = 0; i < this.p; i++) {
        fitted += this.arParams[i] * this.differencedData[t - i - 1];
      }
      
      this.fittedValues.push(fitted);
      this.residuals.push(this.differencedData[t] - fitted);
    }
  }

  private calculateFitQuality(): number {
    if (this.residuals.length === 0) return 0;
    
    const mse = this.residuals.reduce((sum, r) => sum + r * r, 0) / this.residuals.length;
    const dataVariance = this.calculateVariance(this.differencedData);
    
    return Math.max(0, 1 - (mse / dataVariance));
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateAccuracyMetrics(actual: number[], predicted: number[]) {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) return { mae: 0, mse: 0, rmse: 0, mape: 0, r2: 0, accuracy_percentage: 0 };

    let mae = 0, mse = 0, mape = 0;
    
    for (let i = 0; i < n; i++) {
      const error = Math.abs(actual[i] - predicted[i]);
      mae += error;
      mse += error * error;
      if (actual[i] !== 0) {
        mape += Math.abs((actual[i] - predicted[i]) / actual[i]);
      }
    }
    
    mae /= n;
    mse /= n;
    mape = (mape / n) * 100;
    const rmse = Math.sqrt(mse);
    
    // R² 계산
    const actualMean = actual.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const totalSumSquares = actual.slice(0, n).reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.slice(0, n).reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const r2 = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    
    const accuracy_percentage = Math.max(0, 100 - mape);
    
    return { mae, mse, rmse, mape, r2, accuracy_percentage };
  }
}

// SARIMA 모델 (계절성 포함)
export class SARIMAModel extends ARIMAModel {
  name = 'SARIMA';
  private seasonalP: number;
  private seasonalD: number;
  private seasonalQ: number;
  private seasonalPeriod: number;

  constructor(
    p: number = 1, d: number = 1, q: number = 1,
    seasonalP: number = 1, seasonalD: number = 1, seasonalQ: number = 1,
    seasonalPeriod: number = 7
  ) {
    super(p, d, q);
    this.name = 'SARIMA';
    this.seasonalP = seasonalP;
    this.seasonalD = seasonalD;
    this.seasonalQ = seasonalQ;
    this.seasonalPeriod = seasonalPeriod;
  }

  fit(data: TrainingData): void {
    // 계절성 차분 먼저 적용
    const seasonallyDifferenced = this.applySeasonalDifferencing(data.values, this.seasonalD, this.seasonalPeriod);
    
    // 일반 차분 적용
    const fullyDifferenced = this.applyDifferencing(seasonallyDifferenced, this.d);
    
    // 부모 클래스의 fit 메서드 호출 (수정된 데이터로)
    super.fit({ values: fullyDifferenced });
  }

  private applySeasonalDifferencing(data: number[], order: number, period: number): number[] {
    let result = [...data];
    
    for (let d = 0; d < order; d++) {
      const diffed = [];
      for (let i = period; i < result.length; i++) {
        diffed.push(result[i] - result[i - period]);
      }
      result = diffed;
    }
    
    return result;
  }

  predict(steps: number): ForecastResult {
    const result = super.predict(steps);
    
    // SARIMA 통계 정보 업데이트
    result.statistics.model_name = `SARIMA(${this.p},${this.d},${this.q})(${this.seasonalP},${this.seasonalD},${this.seasonalQ})[${this.seasonalPeriod}]`;
    result.statistics.parameters = {
      ...result.statistics.parameters,
      seasonal_p: this.seasonalP,
      seasonal_d: this.seasonalD,
      seasonal_q: this.seasonalQ,
      seasonal_period: this.seasonalPeriod
    };
    
    return result;
  }
}

// Holt-Winters 모델
export class HoltWintersModel implements ForecastModel {
  name = 'Holt-Winters';
  private alpha: number;
  private beta: number;
  private gamma: number;
  private level: number = 0;
  private trend: number = 0;
  private seasonal: number[] = [];
  private seasonalPeriod: number;
  private fittedValues: number[] = [];

  constructor(alpha: number = 0.3, beta: number = 0.2, gamma: number = 0.1, seasonalPeriod: number = 7) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
    this.seasonalPeriod = seasonalPeriod;
  }

  fit(data: TrainingData): void {
    const values = data.values;
    if (values.length === 0) return;

    this.level = values[0];
    this.trend = 0;
    this.seasonal = new Array(this.seasonalPeriod).fill(1);
    this.fittedValues = [];

    // 초기 계절성 패턴 계산
    if (values.length >= this.seasonalPeriod * 2) {
      for (let i = 0; i < this.seasonalPeriod; i++) {
        const seasonalValues = [];
        for (let j = i; j < values.length; j += this.seasonalPeriod) {
          seasonalValues.push(values[j]);
        }
        this.seasonal[i] = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length / this.level;
      }
    }

    // Holt-Winters 적용
    for (let i = 1; i < values.length; i++) {
      const seasonIndex = i % this.seasonalPeriod;
      const prevLevel = this.level;
      const prevTrend = this.trend;

      // Level 업데이트
      this.level = this.alpha * (values[i] / this.seasonal[seasonIndex]) + (1 - this.alpha) * (prevLevel + prevTrend);

      // Trend 업데이트
      this.trend = this.beta * (this.level - prevLevel) + (1 - this.beta) * prevTrend;

      // Seasonal 업데이트
      this.seasonal[seasonIndex] = this.gamma * (values[i] / this.level) + (1 - this.gamma) * this.seasonal[seasonIndex];

      // Fitted value 계산
      this.fittedValues.push((prevLevel + prevTrend) * this.seasonal[seasonIndex]);
    }
  }

  predict(steps: number): ForecastResult {
    const forecasts = [];

    for (let step = 1; step <= steps; step++) {
      const seasonIndex = (this.fittedValues.length + step - 1) % this.seasonalPeriod;
      const baseValue = this.level + (this.trend * step);
      const seasonalFactor = this.seasonal[seasonIndex];
      const predictedValue = Math.max(0, baseValue * seasonalFactor);

      // 신뢰구간 (간소화)
      const uncertainty = Math.sqrt(step) * 10; // 임시 값

      forecasts.push({
        day: step,
        predicted_value: Math.round(predictedValue * 100) / 100,
        confidence_lower: Math.max(0, Math.round((predictedValue - uncertainty) * 100) / 100),
        confidence_upper: Math.round((predictedValue + uncertainty) * 100) / 100,
        confidence_level: Math.max(0.6, 0.95 - (step * 0.02))
      });
    }

    return {
      forecasts,
      statistics: {
        model_name: 'Holt-Winters',
        parameters: {
          alpha: this.alpha,
          beta: this.beta,
          gamma: this.gamma,
          level: this.level,
          trend: this.trend,
          seasonal_period: this.seasonalPeriod
        },
        fit_quality: 0.8, // 임시 값
        seasonal_strength: Math.max(...this.seasonal) - Math.min(...this.seasonal)
      }
    };
  }

  validateFit(testData: number[]): {
    mae: number;
    mse: number;
    rmse: number;
    mape: number;
    r2: number;
    accuracy_percentage: number;
  } {
    const predictions = this.predict(testData.length);
    const predictedValues = predictions.forecasts.map(f => f.predicted_value);

    return this.calculateAccuracyMetrics(testData, predictedValues);
  }

  private calculateAccuracyMetrics(actual: number[], predicted: number[]) {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) return { mae: 0, mse: 0, rmse: 0, mape: 0, r2: 0, accuracy_percentage: 0 };

    // 디버깅 로그 추가
    console.log('🔍 Accuracy Calculation Debug:');
    console.log('Actual values:', actual.slice(0, 5), '... (total:', actual.length, ')');
    console.log('Predicted values:', predicted.slice(0, 5), '... (total:', predicted.length, ')');

    let mae = 0, mse = 0, mape = 0;

    for (let i = 0; i < n; i++) {
      const error = Math.abs(actual[i] - predicted[i]);
      mae += error;
      mse += error * error;
      if (actual[i] !== 0) {
        mape += Math.abs((actual[i] - predicted[i]) / actual[i]);
      }
    }

    mae /= n;
    mse /= n;
    mape = (mape / n) * 100;
    const rmse = Math.sqrt(mse);

    // R² 계산
    const actualMean = actual.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const totalSumSquares = actual.slice(0, n).reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.slice(0, n).reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const r2 = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    const accuracy_percentage = Math.max(0, 100 - mape);

    return { mae, mse, rmse, mape, r2, accuracy_percentage };
  }
}

// 모델 팩토리
export class ModelFactory {
  static createModel(modelType: string, params?: {
    p?: number;
    d?: number;
    q?: number;
    seasonalP?: number;
    seasonalD?: number;
    seasonalQ?: number;
    seasonalPeriod?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  }): ForecastModel {
    switch (modelType.toLowerCase()) {
      case 'arima':
        return new ARIMAModel(
          params?.p || 2,
          params?.d || 1,
          params?.q || 2
        );
      
      case 'sarima':
        return new SARIMAModel(
          params?.p || 1, params?.d || 1, params?.q || 1,
          params?.seasonalP || 1, params?.seasonalD || 1, params?.seasonalQ || 1,
          params?.seasonalPeriod || 7
        );
      
      case 'holt-winters':
        return new HoltWintersModel(
          params?.alpha || 0.3,
          params?.beta || 0.2,
          params?.gamma || 0.1,
          params?.seasonalPeriod || 7
        );
      
      default:
        return new ARIMAModel(); // 기본값
    }
  }

  static getAvailableModels(): string[] {
    return ['arima', 'sarima', 'holt-winters'];
  }
}
