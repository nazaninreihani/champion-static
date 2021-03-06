const showLoadingImage   = require('../../common/utility').showLoadingImage;
const ChampionSocket     = require('../../common/socket');
const Validation         = require('../../common/validation');
const State              = require('../../common/storage').State;
const RiskClassification = require('./risk_classification');

const FinancialAssessment = (() => {
    'use strict';

    const form_selector = '#assessment_form';
    const hidden_class  = 'invisible';

    let financial_assessment = {},
        arr_validation = [];

    const load = () => {
        showLoadingImage($('<div/>', { id: 'loading', class: 'center-text' }).insertAfter('#heading'));
        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
            return false;
        });

        ChampionSocket.send({ get_financial_assessment: 1 }).then((response) => {
            handleForm(response);
        });
    };

    const handleForm = (response) => {
        if (!response) {
            response = State.get(['response', 'get_financial_assessment']);
        }
        hideLoadingImg();
        financial_assessment = response.get_financial_assessment;
        Object.keys(response.get_financial_assessment).forEach((key) => {
            const val = response.get_financial_assessment[key];
            $(`#${key}`).val(val);
        });
        arr_validation = [];
        $(form_selector).find('select').map(function() {
            arr_validation.push({ selector: `#${$(this).attr('id')}`, validations: ['req'] });
        });
        Validation.init(form_selector, arr_validation);
    };

    const submitForm = () => {
        $('#submit').attr('disabled', 'disabled');

        if (Validation.validate(form_selector)) {
            let hasChanged = false;
            Object.keys(financial_assessment).forEach((key) => {
                const $key = $(`#${key}`);
                if ($key.length && $key.val() !== financial_assessment[key]) {
                    hasChanged = true;
                }
            });
            if (Object.keys(financial_assessment).length === 0) hasChanged = true;
            if (!hasChanged) {
                showFormMessage('You did not change anything.', false);
                setTimeout(() => { $('#submit').removeAttr('disabled'); }, 1000);
                return;
            }

            const data = { set_financial_assessment: 1 };
            showLoadingImage($('#form_message'));
            $('#assessment_form').find('select').each(function() {
                financial_assessment[$(this).attr('id')] = data[$(this).attr('id')] = $(this).val();
            });
            ChampionSocket.send(data).then((response) => {
                $('#submit').removeAttr('disabled');
                if ('error' in response) {
                    showFormMessage('Sorry, an error occurred while processing your request.', false);
                } else {
                    showFormMessage('Your changes have been updated successfully.', true);
                    RiskClassification.cleanup();
                }
            });
        } else {
            setTimeout(() => { $('#submit').removeAttr('disabled'); }, 1000);
        }
    };

    const hideLoadingImg = (show_form) => {
        $('#loading').remove();
        if (typeof show_form === 'undefined') {
            show_form = true;
        }
        if (show_form) {
            $('#assessment_form').removeClass(hidden_class);
        }
    };

    const showFormMessage = (msg, isSuccess) => {
        if (isSuccess) {
            $.scrollTo($('h1#heading'), 500, { offset: -10 });
            $('#assessment_form').addClass(hidden_class);
            $('#msg_success').removeClass(hidden_class);
            ChampionSocket.send({ get_account_status: 1 }).then((response_status) => {
                if ($.inArray('authenticated', response_status.get_account_status.status) === -1) {
                    $('#msg_authenticate').removeClass(hidden_class);
                }
            });
        } else {
            $('#form_message').html(msg).delay(5000).fadeOut(1000);
        }
    };

    const unload = () => {
        $(form_selector).off('submit');
    };

    return {
        load      : load,
        unload    : unload,
        handleForm: handleForm,
        submitForm: submitForm,
    };
})();

module.exports = FinancialAssessment;
