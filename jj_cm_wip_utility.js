/**
 * @NApiVersion 2.1
 */
/*************************************************************************************************************************
* Dew Diamonds India
*
* DEWIN-400   Order-to-Cash (O2C) System
*
*******************************************************************************;
* Author: Jobin & Jismi

* Date Created: 15-July-2026

* Description:
 * Small self-contained utility module for the WIP Reports backend. Provides
 * only what the WIP Suitelet/Model need (parameter checks, try-catch wrapping,
 * error stack) so this module does not depend on other report folders.

REVISION HISTORY
* @version 1.0 DEWIN-400: 15-July-2026: Created the initial build


* COPYRIGHT © 2026 Jobin & Jismi.
* All rights reserved. This script is a proprietary product of Jobin & Jismi IT Services LLP and is protected by copyright
* law and international treaties. Unauthorized reproduction or distribution of this script, or any portion of it,
* may result in severe civil and criminal penalties and will be prosecuted to the maximum extent possible under law.
************************************************************************************************************************/
define([], () => {

    /**
     * @description Global variable for storing errors ----> for debugging purposes
     * @type {Array.<Error>}
     */
    const ERROR_STACK = [];

    /**
     * @description Check whether the given parameter has a value on it or is it empty.
     * @param {*} parameter
     * @returns {Boolean} true if there exists a value else false
     */
    const checkForParameter = (parameter) => {
        return parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false
            && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false';
    };

    /**
     * @description Common Try-Catch wrapper, applies to an Object containing methods/functions
     * @param {Object.<string,Function|any>} DATA_OBJ Object containing methods/functions
     * @param {String} NAME Name of the Object
     * @returns {void}
     */
    const applyTryCatch = (DATA_OBJ, NAME) => {
        const tryCatch = function (myfunction, key) {
            return function () {
                try {
                    return myfunction.apply(this, arguments);
                }
                catch (e) {
                    log.error("error in " + key, e);
                    ERROR_STACK.push(e);
                    return false;
                }
            };
        };
        for (let key in DATA_OBJ) {
            if (typeof DATA_OBJ[key] === "function") {
                DATA_OBJ[key] = tryCatch(DATA_OBJ[key], NAME + "." + key);
            }
        }
    };

    return {
        ERROR_STACK,
        checkForParameter,
        applyTryCatch,
    };
});
