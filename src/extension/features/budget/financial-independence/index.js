import { l10n } from 'toolkit/extension/utils/toolkit';
import {
  getEntityManager,
  isCurrentRouteBudgetPage,
  getSelectedMonth,
} from 'toolkit/extension/utils/ynab';
import { Feature } from 'toolkit/extension/features/feature';
import { formatCurrency } from 'toolkit/extension/utils/currency';
import { Collections } from 'toolkit/extension/utils/collections';

export class FinancialIndependence extends Feature {
  _lookbackMonths = parseInt(ynabToolKit.options.FinancialIndependenceHistoryLookup);

  _lookbackLatest = parseInt(ynabToolKit.options.FinancialIndependenceEndDate);

  _ignoreTracking = parseInt(ynabToolKit.options.FinancialIndependenceIgnoreTracking);

  // It may seem counterintuitive, but by setting the min date higher than the max, we can check that everything is working right.
  _minDate = new Date();
  _maxDate = new Date(0);

  _withdrawalRate = parseInt(ynabToolKit.options.FinancialIndependenceWithdrawalRate) / 100;
  _milestone = parseInt(ynabToolKit.options.FinancialIndependenceMilestone) / 100;
  _display = parseInt(ynabToolKit.options.FinancialIndependenceDisplayValue);

  _abbreviation = parseInt(ynabToolKit.options.FinancialIndependenceAbbreviation);

  _growthRate = parseInt(ynabToolKit.options.FinancialIndependenceGrowthRate) / 100;

  _timeFormat = parseInt(ynabToolKit.options.FinancialIndependenceTimeDisplay);

  _progressFormat = parseInt(ynabToolKit.options.FinancialIndependenceProgressFormat);

  _trackingAccounts = [];

  injectCSS() {
    return require('./index.css');
  }

  shouldInvoke() {
    return isCurrentRouteBudgetPage() && !document.querySelector('toolkit-financial-independence');
  }

  invoke() {
    switch (this._lookbackLatest) {
      case 0:
        endMonth = new Date();
        this._maxDate = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0);
        this._minDate = new Date(endMonth.getFullYear(), endMonth.getMonth() - _lookcbackMonths, 0);
        break;
      case 1:
        endMonth = new Date();
        this._maxDate = new Date(endMonth.getFullYear(), endMonth.getMonth(), 0);
        this._minDate = new Date(
          endMonth.getFullYear(),
          endMonth.getMonth() - _lookcbackMonths - 1,
          0
        );
        break;
      case 2:
        endMonth = getSelectedMonth().format('YYYY-MM');
        this._maxDate = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0);
        this._minDate = new Date(endMonth.getFullYear(), endMonth.getMonth() - _lookcbackMonths, 0);
        break;
      case 3:
        endMonth = getSelectedMonth().format('YYYY-MM');
        this._maxDate = new Date(endMonth.getFullYear(), endMonth.getMonth(), 0);
        this._minDate = new Date(
          endMonth.getFullYear(),
          endMonth.getMonth() - _lookcbackMonths - 1,
          0
        );
        break;
    }

    if (this._lookbackMonths === 0) {
      this._minDate = new Date(0);
    }

    const eligibleTransactions = getEntityManager()
      .getAllTransactions()
      .filter(this._eligibleTransactionFilter);

    const accounts = Collections.accountsCollection;

    let balance = 0;
    if (accounts) {
      balance = accounts.reduce((reduced, current) => {
        const note = current.getNote();
        const calculation = current.getAccountCalculation();
        const acctType = current.getAccountType();
        if (
          calculation &&
          !calculation.getAccountIsTombstone() &&
          (acctType === 'OtherAsset' || acctType === 'Savings' || acctType === 'Checking') &&
          (note == null || note.indexOf(':fiexcluded:') === -1)
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
      const progressMilestone =
        Math.floor((balance / milestoneFI) * (this._progressFormat === 0 ? 10000 : 100)) / 100;
      const progressTotal =
        Math.floor((balance / financialIndependence) * (this._progressFormat === 0 ? 10000 : 100)) /
        100;
      const milestone = this._getMilestone(progressTotal);
      const targetMilestone = this._getMilestone(this._milestone * 100);
      const milestoneFIOut = this._formatCurrency(milestoneFI);
      const financialIndependenceOut = this._formatCurrency(financialIndependence);
      const fiTimeTotal = this._getFIPeriod(balance, financialIndependence);
      const fiTimeTarget = this._getFIPeriod(balance, milestoneFI);
      const progressSuffix = this._progressFormat === 0 ? '%' : ' FI';

      switch (this._display) {
        case 1:
          $('.budget-header-days-age', $displayElement).text(
            `${progressMilestone}${progressSuffix}`
          );
          break;
        case 2:
          $('.budget-header-days-age', $displayElement).text(`${milestone}`);
          break;
        case 3:
          $('.budget-header-days-age', $displayElement).text(`${fiTimeTarget}`);
          break;
        case 0:
        default:
          $('.budget-header-days-age', $displayElement).text(`${milestoneFIOut}`);
          break;
      }

      let timeToBase =
        this._timeFormat === 0
          ? l10n('budget.fi.timeToBase', 'Time to FI (Base)')
          : l10n('budget.fi.dateOfBase', 'Date of FI (Base)');

      let timeToTarget =
        this._timeFormat === 0
          ? l10n('budget.fi.timeToMilestone', 'Time to Milestone (Target)')
          : l10n('budget.fi.dateOfMilestone', 'Date of Milestone (Target)');

      $('.budget-header-days-age', $displayElement).attr(
        'title',
        `${l10n('budget.fi.fiNumber', 'FI Number (Base)')}: ${financialIndependenceOut}
${l10n('budget.fi.progress', 'Progress (Base)')}: ${progressTotal}${progressSuffix}
${timeToBase}: ${fiTimeTotal}
${l10n('budget.fi.milestoneCurrent', 'Milestone Achieved')}: ${milestone}
${l10n('budget.fi.fiNumberTarget', 'FI Number (Target)')}: ${milestoneFIOut}
${l10n('budget.fi.progressMilestone', 'Progress (Target)')}: ${progressMilestone}${progressSuffix}
${timeToTarget}: ${fiTimeTarget}
${l10n('budget.fi.milestoneTarget', 'Target Milestone')}: ${targetMilestone}
${l10n('budget.fi.days', 'Total days of budgeting')}: ${totalDays}
${l10n('budget.fi.workingAssets', 'Working Assets')}: ${this._formatCurrency(balance)}
${l10n('budget.fi.avgOutflow', 'Average annual outflow')}: ~${this._formatCurrency(
          averageAnnualOutflow
        )}`
      );
    }
  }

  _getFIPeriod(assets, fiNumber) {
    if (assets >= fiNumber) {
      return 'At or above goal.';
    }

    let fiPeriodRaw = Math.log(fiNumber / assets) / (12 * Math.log(1 + this._growthRate / 12));

    let months = Math.ceil(fiPeriodRaw);

    if (this._timeDisplay === 0) {
      let years = Math.floor(months / 12);
      months -= years * 12;

      if (years === 0 && months === 0) {
        return 'At or above goal.';
      } else if (years === 0) {
        return `${months} month(s)`;
      } else if (months === 0) {
        return `${years} year(s)`;
      }

      return `${years} years and ${months} months`;
    }

    // else
    let date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);

    return `${this._getMonthName(date)} ${date.getFullYear()}`;
  }

  _getMonthName(date) {
    switch (date.getMonth()) {
      case 1:
        return l10n('buget.fi.january', 'Jan');
      case 2:
        return l10n('buget.fi.january', 'Feb');
      case 3:
        return l10n('buget.fi.january', 'Mar');
      case 4:
        return l10n('buget.fi.january', 'Apr');
      case 5:
        return l10n('buget.fi.january', 'May');
      case 6:
        return l10n('buget.fi.january', 'Jun');
      case 7:
        return l10n('buget.fi.january', 'Jul');
      case 8:
        return l10n('buget.fi.january', 'Aug');
      case 9:
        return l10n('buget.fi.january', 'Sep');
      case 10:
        return l10n('buget.fi.january', 'Oct');
      case 11:
        return l10n('buget.fi.january', 'Nov');
      case 12:
        return l10n('buget.fi.january', 'Dec');
    }
  }

  _formatCurrencyWithAbbreviation(amount, suffixes) {
    let _working = amount / 1000;

    if (_working < 1000) {
      return formatCurrency(amount);
    } else if (_working < 1000000) {
      return `${formatCurrency(amount / 1000)} ${suffixes[0]}`;
    } else if (_working < 1000000000) {
      return `${formatCurrency(amount / 1000000)} ${suffixes[1]}`;
    } else if (_working < 1000000000000) {
      return `${formatCurrency(amount / 1000000000)} ${suffixes[2]}`;
    } else if (_working < 1000000000000000) {
      return `${formatCurrency(amount / 1000000000000)} ${suffixes[3]}`;
    }

    return formatCurrency(amount);
  }

  _formatCurrency(amount) {
    switch (this._abbreviation) {
      case 1:
        return this._formatCurrencyWithAbbreviation(amount, [
          l10n('budget.fi.suffixFullThousand', 'thousand'),
          l10n('budget.fi.suffixFullMillion', 'million'),
          l10n('budget.fi.suffixFullBillion', 'billion'),
          l10n('budget.fi.suffixFullTrillion', 'trillion'),
        ]);
      case 2:
        return this._formatCurrencyWithAbbreviation(amount, [
          l10n('budget.fi.suffixAbbrevThousand', 'thou.'),
          l10n('budget.fi.suffixAbbrevFullMillion', 'mill.'),
          l10n('budget.fi.suffixAbbrevBillion', 'bill.'),
          l10n('budget.fi.suffixAbbrevTrillion', 'trill.'),
        ]);
      case 3:
        return this._formatCurrencyWithAbbreviation(amount, [
          l10n('budget.fi.suffixSILikeThousand', 'K'),
          l10n('budget.fi.suffixSILikeFullMillion', 'M'),
          l10n('budget.fi.suffixSILikeBillion', 'B'),
          l10n('budget.fi.suffixSILikeTrillion', 'T'),
        ]);
      case 4:
        return this._formatCurrencyWithAbbreviation(amount, [
          l10n('budget.fi.suffixPureSIThousand', 'K'),
          l10n('budget.fi.suffixPureSIFullMillion', 'M'),
          l10n('budget.fi.suffixPureSIBillion', 'G'),
          l10n('budget.fi.suffixPureSITrillion', 'T'),
        ]);
      case 5:
        return this._formatCurrencyWithAbbreviation(amount, [
          l10n('budget.fi.suffixRomanNumThousand', 'M'),
          l10n('budget.fi.suffixRomanNumFullMillion', 'MM'),
          l10n('budget.fi.suffixRomanNumBillion', 'MMM'),
          l10n('budget.fi.suffixRomanNumTrillion', 'MMMM'),
        ]);
      case 0:
      default:
        return formatCurrency(amount);
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

    let transDate = transaction.get('date');

    isEligibleDate = this._minDate <= transDate && transDate <= this._maxDate;

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
