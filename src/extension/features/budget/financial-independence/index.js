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
  _milestone = parseInt(ynabToolKit.options.FinancialIndependenceMilestone) / 100;
  _display = parseInt(ynabToolKit.options.FinancialIndependenceDisplayValue);

  _keysPrinted = false;

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

    const accounts = Collections.accountsCollection;

    let balance = 0;
    if (accounts) {
      balance = accounts.reduce((reduced, current) => {
        // console.log(current.getNote());
        // getNote will eventually be needed.
        const calculation = current.getAccountCalculation();
        const acctType = current.getAccountType();
        if (
          calculation &&
          !calculation.getAccountIsTombstone() &&
          (acctType === 'OtherAsset' || acctType === 'Savings' || acctType === 'Checking')
        ) {
          let calcBalance = calculation.getBalance();
          if (calcBalance > 0) {
            reduced += calcBalance;
          }
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
      const milestoneFI = financialIndependence * this._milestone;
      const progressMilestone = Math.floor((balance / milestoneFI) * 10000) / 100;
      const progressTotal = Math.floor((balance / financialIndependence) * 10000) / 100;
      const milestone = this._getMilestone(progressTotal);
      const targetMilestone = this._getMilestone(this._milestone * 100);

      if (this._display === 0) {
        // const {units, displayNum} = _getUnits(financialIndependence);
        $('.budget-header-days-age', $displayElement).text(`${formatCurrency(milestoneFI)}`);
      } else {
        $('.budget-header-days-age', $displayElement).text(`${progressMilestone}%`);
      }
      $('.budget-header-days-age', $displayElement).attr(
        'title',
        `${l10n('budget.fi.fiNumber', 'FI Number (Base)')}: ${formatCurrency(financialIndependence)}
${l10n('budget.fi.progress', 'Progress (Base)')}: ${progressTotal}%
${l10n('budget.fi.milestoneCurrent', 'Milestone Achieved')}: ${milestone}
${l10n('budget.fi.fiNumberTarget', 'FI Number (Target)')}: ${formatCurrency(milestoneFI)}
${l10n('budget.fi.progressMilestone', 'Progress (Target)')}: ${progressMilestone}%
${l10n('budget.fi.milestoneTarget', 'Target Milestone')}: ${targetMilestone}
${l10n('budget.fi.days', 'Total days of budgeting')}: ${totalDays}
${l10n('budget.fi.workingAssets', 'Working Assets')}: ${formatCurrency(balance)}
${l10n('budget.fi.avgOutflow', 'Average annual outflow')}: ~${formatCurrency(averageAnnualOutflow)}`
      );
    }
  }

  _getMilestone = progress => {
    if (progress < 10) {
      return l10n('budget.fi.milestoneNone', 'None');
    } else if (progress < 30) {
      return l10n('budget.fi.milestoneFU', 'FU$');
    } else if (progress < 50) {
      return l10n('budget.fi.milestoneLeanFI', 'Lean FI');
    } else if (progress < 80) {
      return l10n('budget.fi.milestoneHalfFI', 'Half FI');
    } else if (progress < 100) {
      return l10n('budget.fi.milestoneFlexFI', 'Flex FI');
    } else if (progress < 120) {
      return l10n('budget.fi.milestoneFI', 'FI');
    } else if (progress < 150) {
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

    let financialIndependence = averageAnnualOutflow / this._withdrawalRate;

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
