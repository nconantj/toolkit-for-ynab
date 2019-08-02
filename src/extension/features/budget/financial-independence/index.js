import { l10n } from 'toolkit/extension/utils/toolkit';
import { getEntityManager } from 'toolkit/extension/utils/ynab';
import { Feature } from 'toolkit/extension/features/feature';
import { isCurrentRouteBudgetPage } from 'toolkit/extension/utils/ynab';
import { formatCurrency } from 'toolkit/extension/utils/currency';
// import { Collections } from 'toolkit/extension/utils/collections';

export class FinancialIndependence extends Feature {
  _lookbackMonths = parseInt(ynabToolKit.options.FinancialIndependenceHistoryLookup);
  // We want to change how this works by finding the actual number of days for the past n months ending on the last day of the previouse month. This calculation will not take the current month's transactions into account.
  _lookbackDays = this._lookbackMonths * 30;

  _withdrawalRate = parseInt(ynabToolKit.options.FinancialIndependenceWithdrawalRate) / 100;
  _milestone = parseInt(ynabToolKit.options.FinancialIndependenceMilestone) / 10;
  // _display = parseInt(ynabToolKit.options.FinancialIndependenceDisplayValue);

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
    this._updateDisplay(calculation, balance);
  }

  onRouteChanged() {
    if (this.shouldInvoke()) {
      this.invoke();
    }
  }

  _updateDisplay(calculation, balance) {
    const { averageAnnualOutflow, financialIndependence, totalDays } = calculation;
    const fiContainer = document.querySelector('.toolkit-financial-independence');

    let $displayElement = $(fiContainer);
    if (!fiContainer) {
      $displayElement = $('<div>', {
        class: 'budget-header-item budget-header-days toolkit-financial-independence',
      })
        .append(
          $('<div>', {
            class: 'budget-header-days-age',
            title: l10n(
              'budget.fi.tooltip',
              'Want to know how close you are to financial independence? Check this out.'
            ),
          })
        )
        .append(
          $('<div>', {
            class: 'budget-header-days-label',
            text: l10n('budget.fi.title', 'Financial Independence'),
            title: l10n(
              'budget.fi.tooltip',
              'Want to know how close you are to financial independence? Check this out.'
            ),
          })
        );
      $('.budget-header-flexbox').append($displayElement);
    }

    if (calculation.notEnoughDates) {
      $('.budget-header-days-age', $displayElement).text('???');
      $('.budget-header-days-age', $displayElement).attr(
        'title',
        l10n(
          'budget.fi.noHistory',
          'Your budget history is less than 30 days. Go on with YNAB a while.'
        )
      );
    } else {
      const progress = Math.floor((balance / financialIndependence) * 100);
      const milestone = this._getMilestone(progress);
      if (this._display === 0) {
        // const {units, displayNum} = _getUnits(financialIndependence);
        $('.budget-header-days-age', $displayElement).text(`${financialIndependence}`);
      } else {
        $('.budget-header-days-age', $displayElement).text(`${progress}%`);
      }
      $('.budget-header-days-age', $displayElement).attr(
        'title',
        `${l10n('budget.fi.fiNumber', 'FI Number')}: ${formatCurrency(financialIndependence)}
${l10n('budget.fi.workingAssets', 'Working Assets')}: ${formatCurrency(balance)}
${l10n('budget.fi.progress', 'Progress')}: ${progress}%
${l10n('budget.fi.fiMileston', 'Milestone')}: ${milestone}
${l10n('budget.fi.days', 'Total days of budgeting')}: ${totalDays}
${l10n('budget.fi.avgOutflow', 'Average annual outflow')}: ~${formatCurrency(averageAnnualOutflow)}`
      );
    }
  }

  _getMilestone = progress => {
    if (progress < 0.1) {
      return l10n('budget.fi.milestoneNone', 'None');
    } else if (progress < 0.3) {
      return l10n('budget.fi.milestoneFU', 'FU$');
    } else if (progress < 0.5) {
      return l10n('budget.fi.milestoneLeanFI', 'Lean FI');
    } else if (progress < 0.8) {
      return l10n('budget.fi.milestoneHalfFI', 'Half FI');
    } else if (progress < 1) {
      return l10n('budget.fi.milestoneFlexFI', 'Flex FI');
    } else if (progress < 1.2) {
      return l10n('budget.fi.milestoneFI', 'FI');
    } else if (progress < 1.5) {
      return l10n('budget.fi.milestoneFatFI', 'Fat FI');
    }

    return l10n('budget.fi.milestoneSuperFI', '1.5 FI or better');
  };

  _calculateFINumber = transactions => {
    const { dates, totalOutflow, uniqueDates } = transactions.reduce(
      (reduced, current) => {
        const { amount, date } = current.getProperties('amount', 'date');
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

    let financialIndependence = (averageAnnualOutflow / this._withdrawalRate) * this._milestone;
    financialIndependence = Math.floor(financialIndependence * 100) / 100;

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

    console.log(account.get('type'));

    switch (account.get('type')) {
      case 'checking':
      case 'savings':
      case 'asset':
        isEligibleType = true;
        break;
      default:
        isEligibleType = false;
        break;
    }

    console.log(isEligibleType);

    return true;
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
