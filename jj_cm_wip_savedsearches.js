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
 * Model layer for the WIP (Work In Progress) Reports. Contains data-access
 * functions that query NetSuite (via SuiteQL) for the Actual WIP Report,
 * returning plain arrays of row objects to the Suitelet.

REVISION HISTORY
* @version 1.0 DEWIN-400: 15-July-2026: Created the initial build


* COPYRIGHT © 2026 Jobin & Jismi.
* All rights reserved. This script is a proprietary product of Jobin & Jismi IT Services LLP and is protected by copyright
* law and international treaties. Unauthorized reproduction or distribution of this script, or any portion of it,
* may result in severe civil and criminal penalties and will be prosecuted to the maximum extent possible under law.
************************************************************************************************************************/
define(['N/query', '../Libraries/jj_cm_wip_utility.js'],
    /**
     * @param{query} query
     * @param{jjUtil} jjUtil
     */
    (query, jjUtil) => {

        const runQuery = (sqlQuery, queryName, params, maxResults) => {
            queryName = queryName || 'UnnamedQuery';
            try {
                if (!sqlQuery) { log.error('runQuery - ERROR: sqlQuery is null or undefined'); return []; }
                const results = [];
                const PAGE_SIZE = 1000;
                let pageIndex = 0;
                let pagedData;
                pagedData = query.runSuiteQLPaged({ query: sqlQuery, params: params || [], pageSize: PAGE_SIZE });
                do {
                    if (pageIndex === 0 && pagedData.pageRanges.length === 0) { break; }
                    const page = pagedData.fetch({ index: pageIndex });
                    const mapped = page.data.asMappedResults();
                    for (let i = 0; i < mapped.length; i++) {
                        results.push(mapped[i]);
                        if (maxResults && results.length >= maxResults) { return results; }
                    }
                    pageIndex++;
                } while (pagedData && pageIndex < pagedData.pageRanges.length);
                return results;
            } catch (error) {
                log.error('runQuery - Error in ' + queryName, error);
                return [];
            }
        };

        /**
         * Builds the shared inner SELECT (Actual WIP source data, unfiltered,
         * unpaged) plus its fixed positional params. Reused by both the report
         * fetch and the filter-dropdown distinct-value queries so the join
         * logic only lives in one place.
         * @param {number} [rowLimit] - when set, adds "AND ROWNUM <= rowLimit"
         *   to the query's own outermost WHERE (no extra subquery level), so
         *   NetSuite can stop scanning early on very large datasets.
         * @param {string} [selectOverride] - when set, replaces the full SELECT
         *   column list with this raw SQL (e.g. "COUNT(*) AS total_count") so a
         *   COUNT/aggregate query can share the exact same FROM/WHERE/joins
         *   without adding any extra subquery wrapping level.
         * @returns {{innerQuery: string, baseParams: Array<string>}}
         */
        const buildActualWIPInnerQuery = (rowLimit, selectOverride) => {
            let rowLimitClause = rowLimit ? `AND ROWNUM <= ${Number(rowLimit)}` : '';
            let selectList = selectOverride || `
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_so) AS custrecord_jj_bagcore_so,
                      BUILTIN_RESULT.TYPE_STRING(CASE WHEN CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_exit IS NULL THEN CUSTOMRECORD_JJ_OPERATIONS_SUB.firstname END) AS manufacturer,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.firstname_0_0) AS sales_executive,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_0) AS so_tranid,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date) AS order_date,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custbody_jj_wo_ring_size) AS ring_size,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date)) AS wo_ageing,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_wo) AS custrecord_jj_bagcore_wo,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_1) AS wo_tranid,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_qty) AS ordered_quantity,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) AS bag_generation_date,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) AS delivery_date,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN TRUNC(CURRENT_DATE) > TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) THEN TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) ELSE 0 END) AS overdue_days,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN TRUNC(CURRENT_DATE) > TRUNC(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) THEN TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) ELSE 0 END) AS production_delay,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_type)) AS order_type,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_customer_name) AS customer_name,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_present_dept)) AS present_department,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.memo_0) AS so_memo_1,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.otherrefnum_0) AS po_number,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_category_0)) AS category,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_category_code_0) AS category_code,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_sub_category_0)) AS sub_category,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_kt_col)) AS design,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_GENERATION.name) AS bag_name,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_stock_type_0)) AS stock_type,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAG_GENERATION.name IS NOT NULL THEN 1 ELSE 0 END) AS no_of_bags,
                      BUILTIN_RESULT.TYPE_FLOAT(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_qty) AS quantity_per_bag,
                      BUILTIN_RESULT.TYPE_DATETIME(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.created_0) AS created,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_item)) AS component_item,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0)) AS stone_quality_group,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS actual_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_color_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_color_0)) AS metal_stone_color,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_quality_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_0)) AS metal_stone_quality,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS actual_diamond_weight_ct,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' AND BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0) = 'PARTY DIAMOND QUALITY' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS party_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_entry)) AS last_move_days,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.companyname) AS companyname,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_pieces_0 ELSE 0 END) AS expected_diamond_pieces_new,
                      BUILTIN_RESULT.TYPE_FLOAT((NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0) + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0 = 7 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_gross_weight_new,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END) AS expected_diamond_weight_test,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_entry)) AS lot_metal_issue_days,
                      BUILTIN_RESULT.TYPE_FLOAT((CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END + CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Colour Stone' THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) + CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS expected_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.75 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_net_weight_new,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.memo_1) AS so_memo_2
            `;
            let innerQuery = `
                    SELECT
                      ${selectList}
                    FROM
                      CUSTOMRECORD_JJ_BAG_GENERATION,
                      (SELECT
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_bag_name AS custrecord_jj_bagcoremat_bag_name,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_bag_name AS custrecord_jj_bagcoremat_bag_name_join,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_actual_pieces_info AS custrecord_jj_actual_pieces_info,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.created AS created_0,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_item AS custrecord_jj_bagcoremat_item,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.id_0_0_0 AS id_0_0_0_0,
                        item_SUB_0.custitem_jj_stone_quality_group AS custitem_jj_stone_quality_group_0,
                        item_SUB_0.custitem_jj_metal_purity_percent AS custitem_jj_metal_purity_percent_0,
                        item_SUB_0.id_0_0 AS id_0_0_1,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_quantity AS custrecord_jj_quantity_0,
                        item_SUB_0.CLASS AS class_0,
                        item_SUB_0.custitem_jj_metal_color AS custitem_jj_metal_color_0,
                        item_SUB_0.custitem_jj_stone_color AS custitem_jj_stone_color_0,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_qty AS custrecord_jj_bagcoremat_qty,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_newly_add_line AS custrecord_jj_bagcoremat_newly_add_line,
                        item_SUB_0.custitem_jj_metal_quality AS custitem_jj_metal_quality_0,
                        item_SUB_0.custitem_jj_stone_quality AS custitem_jj_stone_quality_0,
                        item_SUB_0.id_join_0 AS id_join_0_0,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_pieces AS custrecord_jj_pieces_0
                      FROM
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS,
                        (SELECT
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material AS custrecord_jj_bag_core_material,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material AS custrecord_jj_bag_core_material_join,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.created AS created,
                          CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0.id_0_0 AS id_0_0_0,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_quantity AS custrecord_jj_quantity,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_pieces AS custrecord_jj_pieces
                        FROM
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS,
                          (SELECT
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.ID AS id_0,
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.ID AS id_join,
                            item_SUB.id_0 AS id_0_0
                          FROM
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0,
                            (SELECT
                              item.ID AS ID,
                              item.ID AS id_join,
                              classification.ID AS id_0
                            FROM
                              item,
                              classification
                            WHERE
                              item.CLASS = classification.ID(+)
                            ) item_SUB
                          WHERE
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.custrecord_jj_bagcoremat_item = item_SUB.ID(+)
                          ) CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0
                        WHERE
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material = CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0.id_0(+)
                        ) CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB,
                        (SELECT
                          item_0.ID AS id_0,
                          item_0.ID AS id_join,
                          item_0.custitem_jj_stone_quality_group AS custitem_jj_stone_quality_group,
                          item_0.custitem_jj_metal_purity_percent AS custitem_jj_metal_purity_percent,
                          classification_SUB.id_0 AS id_0_0,
                          item_0.CLASS AS CLASS,
                          item_0.custitem_jj_metal_color AS custitem_jj_metal_color,
                          item_0.custitem_jj_stone_color AS custitem_jj_stone_color,
                          item_0.custitem_jj_metal_quality AS custitem_jj_metal_quality,
                          item_0.custitem_jj_stone_quality AS custitem_jj_stone_quality,
                          classification_SUB.id_join AS id_join_0
                        FROM
                          item item_0,
                          (SELECT
                            classification_0.ID AS ID,
                            classification_0.ID AS id_join,
                            classification_1.ID AS id_0
                          FROM
                            classification classification_0,
                            classification classification_1
                          WHERE
                            classification_0.PARENT = classification_1.ID(+)
                          ) classification_SUB
                        WHERE
                          item_0.CLASS = classification_SUB.ID(+)
                        ) item_SUB_0
                      WHERE
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.ID = CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_bag_core_material(+)
                         AND CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_item = item_SUB_0.id_0(+)
                      ) CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB,
                      (SELECT
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.ID AS id_1,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.ID AS id_join,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so AS custrecord_jj_bagcore_so,
                        transaction_SUB.firstname_0 AS firstname_0_0,
                        transaction_SUB.enddate AS enddate_0,
                        transaction_SUB.firstname_0_0 AS firstname_0_0_0,
                        transaction_SUB.tranid AS tranid_0,
                        transaction_SUB.custentity_jj_entity_customer_code_0 AS custentity_jj_entity_customer_code_0_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_order_date AS custrecord_jj_bagcore_order_date,
                        workOrder.custbody_jj_wo_ring_size AS custbody_jj_wo_ring_size,
                        transaction_SUB.quantitybilled AS quantitybilled_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo AS custrecord_jj_bagcore_wo,
                        transaction_0.tranid AS tranid_1,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_kt_col AS custrecord_jj_bagcore_kt_col,
                        transaction_SUB.item AS item_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_qty AS custrecord_jj_bagcore_qty,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_duedate AS custrecord_jj_bagcore_duedate,
                        transaction_SUB.firstname_1 AS firstname_1_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_order_type AS custrecord_jj_bagcore_order_type,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_customer_name AS custrecord_jj_bagcore_customer_name,
                        item_SUB_1.custitem_jj_metal_color AS custitem_jj_metal_color_0,
                        transaction_SUB.memo AS memo_0,
                        transaction_SUB.otherrefnum AS otherrefnum_0,
                        item_SUB_1.custitem_jj_category AS custitem_jj_category_0,
                        item_SUB_1.custrecord_jj_category_code AS custrecord_jj_category_code_0,
                        item_SUB_1.custitem_jj_sub_category AS custitem_jj_sub_category_0,
                        item_SUB_1.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code_0,
                        item_SUB_1.custrecord_jj_sub_cate_types AS custrecord_jj_sub_cate_types_0,
                        item_SUB_1.custitem_jj_stock_type AS custitem_jj_stock_type_0,
                        Customer.companyname AS companyname,
                        Customer.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code_1,
                        CUSTOMRECORD_JJ_SUB_CATEGORY.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code_1,
                        salesOrder.memo AS memo_1,
                        salesOrder.custbody_jj_customer_shop_code AS custbody_jj_customer_shop_code,
                        workOrder.status AS status,
                        workOrder.trandate AS trandate,
                        salesOrder.trandate AS trandate_0,
                        transaction_0.status AS status_crit,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.isinactive AS isinactive_crit,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_is_rejected AS custrecord_jj_bagcore_is_rejected_crit,
                        transaction_SUB.mainline_crit AS mainline_crit_0
                      FROM
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING,
                        Customer,
                        CUSTOMRECORD_JJ_SUB_CATEGORY,
                        (SELECT
                          item_1.ID AS ID,
                          item_1.ID AS id_join,
                          item_1.custitem_jj_metal_color AS custitem_jj_metal_color,
                          item_1.custitem_jj_category AS custitem_jj_category,
                          CUSTOMRECORD_JJ_CATEGORY.custrecord_jj_category_code AS custrecord_jj_category_code,
                          item_1.custitem_jj_sub_category AS custitem_jj_sub_category,
                          CUSTOMRECORD_JJ_SUB_CATEGORY_0.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code,
                          CUSTOMRECORD_JJ_SUB_CATEGORY_0.custrecord_jj_sub_cate_types AS custrecord_jj_sub_cate_types,
                          item_1.custitem_jj_stock_type AS custitem_jj_stock_type
                        FROM
                          item item_1,
                          CUSTOMRECORD_JJ_CATEGORY,
                          CUSTOMRECORD_JJ_SUB_CATEGORY CUSTOMRECORD_JJ_SUB_CATEGORY_0
                        WHERE
                          item_1.custitem_jj_category = CUSTOMRECORD_JJ_CATEGORY.ID(+)
                           AND item_1.custitem_jj_sub_category = CUSTOMRECORD_JJ_SUB_CATEGORY_0.ID(+)
                        ) item_SUB_1,
                        salesOrder,
                        (SELECT
                          TRANSACTION.ID AS id_0,
                          TRANSACTION.ID AS id_join,
                          Customer_SUB.firstname AS firstname_0,
                          TRANSACTION.enddate AS enddate,
                          Customer_SUB.firstname_0 AS firstname_0_0,
                          TRANSACTION.tranid AS tranid,
                          Customer_SUB.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code_0,
                          transactionLine.quantitybilled AS quantitybilled,
                          transactionLine.item AS item,
                          employee.firstname AS firstname_1,
                          TRANSACTION.memo AS memo,
                          TRANSACTION.otherrefnum AS otherrefnum,
                          transactionLine.mainline AS mainline_crit
                        FROM
                          TRANSACTION,
                          employee,
                          (SELECT
                            Customer_0.ID AS ID,
                            Customer_0.ID AS id_join,
                            employee_0.firstname AS firstname,
                            employee_1.firstname AS firstname_0,
                            Customer_0.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code
                          FROM
                            Customer Customer_0,
                            employee employee_0,
                            employee employee_1
                          WHERE
                            Customer_0.custentity1 = employee_0.ID(+)
                             AND Customer_0.salesrep = employee_1.ID(+)
                          ) Customer_SUB,
                          transactionLine
                        WHERE
                          ((TRANSACTION.employee = employee.ID(+) AND TRANSACTION.entity = Customer_SUB.ID(+)))
                           AND TRANSACTION.ID = transactionLine.TRANSACTION
                        ) transaction_SUB,
                        TRANSACTION transaction_0,
                        workOrder
                      WHERE
                        ((((((CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_customer = Customer.ID(+) AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_item_subcategory = CUSTOMRECORD_JJ_SUB_CATEGORY.ID(+)) AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_kt_col = item_SUB_1.ID(+)) AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so = salesOrder.ID(+)) AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so = transaction_SUB.id_0(+)) AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo = transaction_0.ID(+)))
                         AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo = workOrder.ID(+)
                      ) CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB,
                      (SELECT
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_bagno AS custrecord_jj_oprtns_bagno,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_bagno AS custrecord_jj_oprtns_bagno_join,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_exit AS custrecord_jj_oprtns_exit,
                        employee_2.firstname AS firstname,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_entry AS custrecord_jj_oprtns_entry,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_exit AS custrecord_jj_oprtns_exit_crit
                      FROM
                        CUSTOMRECORD_JJ_OPERATIONS,
                        employee employee_2
                      WHERE
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_employee = employee_2.ID(+)
                      ) CUSTOMRECORD_JJ_OPERATIONS_SUB
                    WHERE
                      (((CUSTOMRECORD_JJ_BAG_GENERATION.ID = CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_bag_name(+) AND CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_bagcore = CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.id_1(+)) AND CUSTOMRECORD_JJ_BAG_GENERATION.ID = CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_bagno(+)))
                       AND ((NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_merge, 'F') = ? AND (NOT(
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.status_crit IN ('WorkOrd:G', 'WorkOrd:C', 'WorkOrd:H')
                      ) OR CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.status_crit IS NULL) AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.isinactive, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_split, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_is_rejected, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.isinactive_crit, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_is_rejected_crit, 'F') = ? AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.mainline_crit_0 = ? AND CASE WHEN CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_exit_crit IS NULL THEN 1 ELSE 0 END IN ('1')))
                      ${rowLimitClause}
                `;

            return { innerQuery, baseParams: ['F', 'F', 'F', 'F', 'F', 'F', 'T'] };
        };

        /**
         * @param {number} page - 1-indexed page number.
         * @param {number} pageSize - number of rows per page.
         * @returns {{data: Array<Object>, totalCount: number, page: number, pageSize: number, totalPages: number}}
         */
        const getActualWIPReport = (page, pageSize) => {
            try {
                page = Number(page) > 0 ? Number(page) : 1;
                pageSize = Number(pageSize) > 0 ? Number(pageSize) : 20;
                const startRow = (page - 1) * pageSize + 1;
                const endRow = page * pageSize;

                // ROWNUM <= endRow is injected directly into the query's own
                // outermost WHERE (no extra subquery level, unlike the
                // ROWNUM-wrap/OFFSET-FETCH approaches that broke NetSuite's
                // internal paged-result fetch on this deeply nested query).
                // This lets Oracle stop scanning once endRow rows are found,
                // instead of materializing the full 100k-row result set on
                // every page request. The last pageSize rows are then sliced
                // off in JS since ROWNUM alone can't express "skip the first
                // startRow-1 rows".
                let { innerQuery: countQuery, baseParams: countBaseParams } = buildActualWIPInnerQuery(null, 'COUNT(*) AS total_count');
                let countResult = runQuery(countQuery, 'getActualWIPReport_count', countBaseParams);
                let totalCount = (countResult[0] && Number(countResult[0].total_count)) || 0;

                let { innerQuery, baseParams } = buildActualWIPInnerQuery(endRow);
                let params = baseParams.slice();

                let upToPageResults = runQuery(innerQuery, 'getActualWIPReport', params);
                let rawResults = upToPageResults.slice(startRow - 1, endRow);
                log.debug('getActualWIPReport - raw result count', rawResults.length);
                log.debug('getActualWIPReport - raw sample row', rawResults[0]);

                let mappedResults = rawResults.map((row) => ({
                    presentDepartment: row.present_department,
                    bagNumber: row.bag_name,
                    componentItems: row.component_item,
                    stoneQualityGroup: row.stone_quality_group,
                    manufacturer: row.manufacturer,
                    poNumber: row.po_number,
                    salesOrderNo: row.so_tranid,
                    workorder: row.wo_tranid,
                    salesExecutive: row.sales_executive,
                    orderDate: row.order_date,
                    woAgeing: row.wo_ageing,
                    lastMoveDays: row.last_move_days,
                    orderRemarks: row.so_memo_1 || row.so_memo_2,
                    overDueDays: row.overdue_days,
                    orderType: row.order_type,
                    stockType: row.stock_type,
                    orderedQuantity: row.ordered_quantity,
                    bagGenerationDate: row.bag_generation_date,
                    noOfBags: row.no_of_bags,
                    quantityPerBag: row.quantity_per_bag,
                    customerName: row.customer_name || row.companyname,
                    deliveryDate: row.delivery_date,
                    design: row.design,
                    category: row.category,
                    categoryCode: row.category_code,
                    subCategory: row.sub_category,
                    productionDelays: row.production_delay,
                    issueDate: row.created,
                    ringSize: row.ring_size,
                    metalStoneQuality: row.metal_stone_quality,
                    metalStoneColor: row.metal_stone_color,
                    partyDiamondWeight: row.party_diamond_weight,
                    actualDiamondWeightCt: row.actual_diamond_weight_ct,
                    lotMetalIssueDays: row.lot_metal_issue_days,
                    expectedDiamondPiecesNew: row.expected_diamond_pieces_new,
                    expectedDiamondWeightTest: row.expected_diamond_weight_test,
                    expectedDiamondWeight: row.expected_diamond_weight,
                    expectedGrossWeightNew: row.expected_gross_weight_new,
                    expectedMetalPureWeight: row.expected_metal_pure_weight,
                    expectedNetWeightNew: row.expected_net_weight_new,
                    actualMetalPureWeight: row.actual_metal_pure_weight,
                }));
                log.debug('getActualWIPReport - mapped result count', mappedResults.length);
                log.debug('getActualWIPReport - mapped sample row', mappedResults[0]);

                return {
                    data: mappedResults,
                    totalCount: totalCount,
                    page: page,
                    pageSize: pageSize,
                    totalPages: Math.ceil(totalCount / pageSize),
                };
            } catch (error) {
                log.error('Error @ getActualWIPReport', error);
                return { data: [], totalCount: 0, page: page, pageSize: pageSize, totalPages: 0 };
            }
        };

        const wipModel = { getActualWIPReport };
        jjUtil.applyTryCatch(wipModel, 'JJ CM WIP Saved Searches');

        return wipModel;
    });
