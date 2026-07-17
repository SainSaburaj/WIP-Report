<template>
    <div class="min-h-screen w-full p-6">

        <div class="w-full mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-xl font-bold text-gray-800">Actual WIP Report</h1>
                </div>
                <div class="flex items-center gap-2 relative">
                    <button @click="toggleDropdown" class="bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-gray-400 rounded-md px-3 py-2 text-sm shadow-sm">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <div v-if="showDropdown" class="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                        <ul class="text-gray-700 text-sm">
                            <li @click="downloadCSV(); toggleDropdown()" class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                                <i class="fas fa-file-csv mr-2"></i> CSV
                            </li>
                            <li @click="downloadExcel(); toggleDropdown()" class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                                <i class="fas fa-file-excel mr-2 text-green-600"></i> Excel
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div>
                <!-- Data Table Section -->
                <div class="mb-6">
                    <h2 class="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                        <span class="flex items-center">
                            <i class="fas fa-table mr-2 text-table-600"></i>WIP Data
                        </span>
                    </h2>
                    <div class="table-main bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
                        <table class="w-full whitespace-nowrap">
                            <thead>
                                <tr class="bg-gray-700 text-white text-[12px] uppercase tracking-wide">
                                    <th class="frozen-col px-4 py-2 text-left font-medium bg-gray-700">Present Department</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Bag Number</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Component Items</th>
                                    <th class="px-4 py-3 text-left font-medium bg-gray-700">Stone Quality Group</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Manufacturer</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">PO Number</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sales Order No</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Work Order No</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sales Executive</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Date</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">WO Ageing</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">LAST Move Days</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Remarks</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">OverDue Days</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Order Type</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Stock Type</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Ordered Quantity</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Bag Generation Date</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">No Of Bags</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Quantity Per Bag</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Customer Name</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Delivery Date</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Design</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Category</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Category Code</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Sub Category</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Production Delays</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Issue Date</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Ring Size</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Quality</th>
                                    <th class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Color</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Party Diamond Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Diamond Weight (CT)</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Lot Metal Issue days</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Pieces new</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Weight test</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Gross Weight NEW</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Metal Pure Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Net Weight New</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Metal Pure Weight</th>
                                </tr>
                            </thead>
                            <tbody v-if="loading" class="divide-y divide-gray-100">
                                <tr v-for="n in skeletonRowCount" :key="'skeleton-' + n" class="animate-pulse">
                                    <td v-for="c in 39" :key="c" class="px-4 py-3" :class="{ 'frozen-col bg-white': c === 1 }">
                                        <div class="h-3 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            </tbody>
                            <tbody v-else class="divide-y divide-gray-100">
                                <tr v-for="(row, index) in filteredData" :key="index" class="hover:bg-gray-50">
                                    <td class="frozen-col px-4 py-1.5 text-gray-900 bg-white">{{ row.presentDepartment }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.bagNumber }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.componentItems }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.stoneQualityGroup }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.manufacturer }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.poNumber }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.salesOrderNo }}</td>
                                    <td class="px-4 py-1.5 font-medium text-gray-900">{{ row.workorder }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.salesExecutive }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.orderDate }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.woAgeing }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.lastMoveDays }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.orderRemarks }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.overDueDays }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.orderType }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.stockType }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.orderedQuantity }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.bagGenerationDate }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.noOfBags }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.quantityPerBag }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.customerName }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.deliveryDate }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.design }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.category }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.categoryCode }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.subCategory }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.productionDelays }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.issueDate }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.ringSize }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneQuality }}</td>
                                    <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneColor }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.partyDiamondWeight }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.actualDiamondWeightCt }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.lotMetalIssueDays }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondPiecesNew }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondWeightTest }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedDiamondWeight }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedGrossWeightNew }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedMetalPureWeight }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.expectedNetWeightNew }}</td>
                                    <td class="px-4 py-1.5 text-right text-gray-900">{{ row.actualMetalPureWeight }}</td>
                                </tr>
                                <tr v-if="filteredData.length === 0">
                                    <td colspan="39" class="px-4 py-8 text-center text-gray-500">
                                        <i class="fas fa-search text-gray-400 text-lg block mb-2"></i>
                                        No records found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-xs text-gray-500">
                            Page {{ currentPageNumber }} of
                            <span v-if="totalPagesLoading" class="inline-block w-8 h-3 bg-gray-200 rounded animate-pulse align-middle"></span>
                            <template v-else>{{ totalPages || 1 }}</template>
                        </span>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToPrevPage" :disabled="!canGoPrev"
                                class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 hover:bg-white">
                                <i class="fas fa-angle-left"></i> Previous
                            </button>
                            <button @click="goToNextPage" :disabled="!canGoNext"
                                class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 hover:bg-white">
                                Next <i class="fas fa-angle-right"></i>
                            </button>
                        </div>
                        <span class="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                            <span v-if="loading" class="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                            <template v-if="!loading">{{ wipData.length }} records on this page</template>
                            <template v-else>Loading records&hellip;</template>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from "vue-toast-notification";
import * as XLSX from 'xlsx';
import { useAllReportsApi } from '../services/NetSuite_API';

const PAGE_SIZE = 500;

export default {
    name: 'ActualWIPReport',
    setup() {
        const $toast = useToast();
        const { fetchActualWipData, actualWipData } = useAllReportsApi();
        const loading = ref(true);
        const wipData = ref([]);

        const skeletonRowCount = PAGE_SIZE;
        const showDropdown = ref(false);
        // Keyset (seek) pagination: each page load asks the backend for rows
        // strictly after (or before) a cursor ID, so every page loads in
        // roughly constant time regardless of depth -- unlike page-number/
        // OFFSET-based paging, which gets slower the deeper you go because
        // the database has to scan through every prior row first.
        const currentPageNumber = ref(1);
        const canGoNext = ref(false);
        const canGoPrev = ref(false);
        // Stack of "first row ID on this page" for every page visited so far,
        // so Previous can seek backward from the current page's first ID.
        const pageStartCursors = ref([null]);
        // Total page count is included only in the very first response (no
        // cursorId) -- the backend runs a one-time COUNT(*) scan for that
        // request only, never on subsequent Next/Previous clicks.
        const totalPages = ref(null);
        const totalPagesLoading = ref(true);

        const toggleDropdown = () => {
            showDropdown.value = !showDropdown.value;
        };

        const loadPage = async (cursorId, direction) => {
            loading.value = true;
            try {
                await fetchActualWipData({}, {
                    pageSize: PAGE_SIZE,
                    cursorId,
                    direction,
                });
                wipData.value = actualWipData.value.data || [];
                canGoNext.value = Boolean(actualWipData.value.hasNext);
                canGoPrev.value = Boolean(actualWipData.value.hasPrev);
                if (actualWipData.value.totalPages !== null && actualWipData.value.totalPages !== undefined) {
                    totalPages.value = actualWipData.value.totalPages;
                    totalPagesLoading.value = false;
                }
            } catch (error) {
                $toast.error("Error fetching data", { position: "top" });
            } finally {
                loading.value = false;
            }
        };

        const goToNextPage = async () => {
            if (!canGoNext.value) { return; }
            const lastId = actualWipData.value.lastId;
            await loadPage(lastId, 'next');
            currentPageNumber.value += 1;
            pageStartCursors.value.push(lastId);
        };

        const goToPrevPage = async () => {
            if (!canGoPrev.value || currentPageNumber.value <= 1) { return; }
            pageStartCursors.value.pop();
            const prevCursor = pageStartCursors.value[pageStartCursors.value.length - 1];
            await loadPage(prevCursor, prevCursor ? 'next' : undefined);
            currentPageNumber.value -= 1;
        };

        const filteredData = computed(() => wipData.value);

        const totalWorkOrders = computed(() => wipData.value.length);

        const totalQuantity = computed(() => {
            return wipData.value.reduce((sum, row) => sum + (Number(row.orderedQuantity) || 0), 0);
        });

        const statusCounts = computed(() => {
            let inProgress = 0;
            let completed = 0;
            wipData.value.forEach(row => {
                const overdue = Number(row.overDueDays) || 0;
                if (overdue > 0) inProgress++;
                else completed++;
            });
            return { inProgress, completed };
        });

        onMounted(async () => {
            await loadPage(null, undefined);
        });

        const getTimestamp = () => {
            const now = new Date();
            return now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + "_" +
                String(now.getHours()).padStart(2, '0') + "-" +
                String(now.getMinutes()).padStart(2, '0') + "-" +
                String(now.getSeconds()).padStart(2, '0');
        };

        const exportColumns = [
            ["Present Department", "presentDepartment"],
            ["Bag Number", "bagNumber"],
            ["Component Items", "componentItems"],
            ["Stone Quality Group", "stoneQualityGroup"],
            ["Manufacturer", "manufacturer"],
            ["PO Number", "poNumber"],
            ["Sales Order No", "salesOrderNo"],
            ["Work Order No", "workorder"],
            ["Sales Executive", "salesExecutive"],
            ["Order Date", "orderDate"],
            ["WO Ageing", "woAgeing"],
            ["LAST Move Days", "lastMoveDays"],
            ["Order Remarks", "orderRemarks"],
            ["OverDue Days", "overDueDays"],
            ["Order Type", "orderType"],
            ["Stock Type", "stockType"],
            ["Ordered Quantity", "orderedQuantity"],
            ["Bag Generation Date", "bagGenerationDate"],
            ["No Of Bags", "noOfBags"],
            ["Quantity Per Bag", "quantityPerBag"],
            ["Customer Name", "customerName"],
            ["Delivery Date", "deliveryDate"],
            ["Design", "design"],
            ["Category", "category"],
            ["Category Code", "categoryCode"],
            ["Sub Category", "subCategory"],
            ["Production Delays", "productionDelays"],
            ["Issue Date", "issueDate"],
            ["Ring Size", "ringSize"],
            ["Metal/Stone Quality", "metalStoneQuality"],
            ["Metal/Stone Color", "metalStoneColor"],
            ["Party Diamond Weight", "partyDiamondWeight"],
            ["Actual Diamond Weight (CT)", "actualDiamondWeightCt"],
            ["Lot Metal Issue days", "lotMetalIssueDays"],
            ["Expected Diamond Pieces new", "expectedDiamondPiecesNew"],
            ["Expected Diamond Weight test", "expectedDiamondWeightTest"],
            ["Expected Diamond Weight", "expectedDiamondWeight"],
            ["Expected Gross Weight NEW", "expectedGrossWeightNew"],
            ["Expected Metal Pure Weight", "expectedMetalPureWeight"],
            ["Expected Net Weight New", "expectedNetWeightNew"],
            ["Actual Metal Pure Weight", "actualMetalPureWeight"],
        ];

        const downloadCSV = () => {
            const rows = [exportColumns.map(([label]) => label)];

            filteredData.value.forEach(row => {
                rows.push(exportColumns.map(([, key]) => row[key]));
            });

            const csvContent = rows.map(row => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const timestamp = getTimestamp();
                const filename = `actual_wip_report_${timestamp}.csv`;

                link.setAttribute("href", URL.createObjectURL(blob));
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };

        const downloadExcel = () => {
            const ws_data = [exportColumns.map(([label]) => label)];

            filteredData.value.forEach(row => {
                ws_data.push(exportColumns.map(([, key]) => row[key]));
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Actual WIP Report");

            const timestamp = getTimestamp();
            const filename = `actual_wip_report_${timestamp}.xlsx`;

            XLSX.writeFile(wb, filename);
        };

        return {
            loading,
            skeletonRowCount,
            wipData,
            downloadCSV,
            downloadExcel,
            showDropdown,
            toggleDropdown,
            filteredData,
            totalWorkOrders,
            totalQuantity,
            statusCounts,
            currentPageNumber,
            canGoNext,
            canGoPrev,
            goToNextPage,
            goToPrevPage,
            totalPagesLoading,
            totalPages,
        };
    }
};
</script>
<style scoped>
body{
    padding: 0;
    margin: 0;
}
.badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 9999px;
    display: inline-block;
}

.badge-progress {
    background-color: #FEF3C7;
    color: #92400E;
}

.badge-done {
    background-color: #D1FAE5;
    color: #065F46;
}

.badge-pending {
    background-color: #E5E7EB;
    color: #374151;
}

.table-main {
    height: 630px !important;
    overflow: auto;
    font-size: 11px;
}

.table-main thead th {
    position: sticky;
    top: 0;
    z-index: 20;
}

.table-main .frozen-col {
    position: sticky;
    left: 0;
    z-index: 10;
}

.table-main thead th.frozen-col {
    z-index: 30;
}

tr {
    transition: background-color 0.15s ease;
}
</style>
