import { l10n } from 'toolkit/extension/utils/toolkit';
import { getEntityManager } from 'toolkit/extension/utils/ynab';
import { Feature } from 'toolkit/extension/features/feature';
import { isCurrentRouteBudgetPage } from 'toolkit/extension/utils/ynab';
import { formatCurrency } from 'toolkit/extension/utils/currency';
import { Collections } from 'toolkit/extension/utils/collections';

export class FinancialIndependence extends Feature {
  _lookbackMonths = parseInt(ynabToolKit.options.FinancialIndependenceHistoryLookup);
  // We want to change how this works by finding the actual number of days for the past n months ending on the last day of the previouse month. This calculation will not take the current month's transactions into account.
  _lookbackDays = this._lookbackMonths * 30;
  
  _withdrawalRate = parseInt(ynabToolKit.options.FinancialIndependenceWithdrawalRate) / 100;
  _milestone = parseInt(ynabToolKit.options.FinancialIndependenceMilestone) / 10;
  _display = parseInt(ynabToolKit.options.FinancialIndependenceDisplayValue);

  injectCSS() {
    return require('./index.css');
  }

  shouldInvoke() {
    return isCurrentRouteBudgetPage() && !document.querySelector('toolkit-financial-independence');
  }

  invoke() {
    const eligibleTransactions = getEntityManager()
      .getAllTransactions()
      .filter(this._eligibleTransactionFilter);
      
    const accounts = getEntityManager()
      .getAllAccounts()
      .filter(this._accountFilter);
      
    let balance = 0;
    if (accounts) {
      balance = accounts.reduce((reduced, current) => {
        const calculation = current.getAccountCalculation();
        if (calculation && !calculation.getAccountIsTombstone()) {
          reduced += calculation.getBalance();
        }
        
        return reduced;
      }, 0);
    }
    
    const calculation = this._calculateFINumber(eligibleTransactions);
    this.updateDisplay(calculation, balance);
  }
  
  onRouteChanged() {
    if (this.shouldInvoke()) {
      this.invoke();
    }
  }
  
  _updateDisplay(calculation) {}
  
  _calculateFINumber = (transactions) => {
    const { dates, totalOutflow, uniqueDates } = transaction.reduce(
      (reduced, current) => {
        const {amount, date} = current.getProperties('amount', 'date');
        reduced.dates.push(date.toUTCMoment());
        reduced.uniqueDates.set(date.format());
        reduced.totalOutflow += amount;
        return reduced;
      },
      { dates: [], totalOutflow: 0, uniqueDates: new Map() }
    );
    
    const minDate = moment.min(dates);
    const maxDate = moment.max(dates);
    const availableDates = maxDate.diff(minDate, 'days');
    
    let averageDailyOutflow;
    let averageMonthlyOutflow;
    let averageAnnualOutflow;
    
    if (this._lookbackDays !== 0) {
      averageDailyOutflow = Math.abs(totalOutflow / this._lookbackDays);
    } else {
      averageDailyOutflow = Math.abs(totalOutflow / availableDates);
    }
    
    averageMonthlyOutflow = averageDailyOutflow * 30; // To be removed.
    averageAnnualOutflow = averageMonthlyOutflow * 12; // To be changed to daily * 365.25
    
    let financialIndependence = (averageAnnualOutflow / _withdrawalRate) * _milestone;
    financialIndependence = Math.floor(financialIndependence);
    
    const notEnoughDates = uniqueDates.size < 30;
    if (notEnoughDates) {
      financialIndependence = null;
    }
    
    return {
      averageDailyOutflow,
      averageAnnualOutflow,
      financialIndependence,
      notEnoughDates,
      totalDays: uniqueDates.size,
      totalOutflow,
    };
  };
  
  _accountFilter = account => {
    let isEligibleType = false;
    
    switch( account.get('type') ) {
      case "checking":
      case "savings":
      case "asset":
        isEligibleType = true;
      break;
      default:
        isEligibleType = false;
      break;
    }
    
    return (
      isEligibleType &&
      !account.get('closed') &&
      !account.get('deleted') &&
      account.get('balance') > 0;
    );
  };
  _eligibleTransactionFilter = transaction => {
    const today = new ynab.utilities.DateWithoutTime();
  
    let isEligibleDate = false;
  
    if (this._lookbackDays === 0) {
      isEligibleDate = true;
    } else {
      isEligibleDate = transaction.get('date').daysApart(today) < this._lookbackDays;
    }
    
    return (
      isEligibleDate &&
      !transaction.get('isTombstone') &&
      !transaction.get('payee.isInternal') &&
      !transaction.isTransferTransaction() &&
      transaction.get('account.onBudget') &&
      transaction.get('amount') < 0
    );
  };
}
