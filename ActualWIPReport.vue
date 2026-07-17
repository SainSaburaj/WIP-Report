<template>
    <div class="min-h-screen w-full p-6 bg-gray-50">

        <div class="w-full mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-xl font-semibold text-gray-800">Actual WIP Report</h1>
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
                        <span class="text-xs font-normal text-gray-500">Page {{ currentPage }} of {{ totalPages || 1 }} &middot; {{ totalCount }} records</span>
                    </h2>
                    <div class="table-main bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
                        <table class="w-full text-[12px] whitespace-nowrap">
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
                                    <td class="frozen-col px-4 py-3 text-gray-600 bg-white">{{ row.presentDepartment }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.bagNumber }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.componentItems }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.stoneQualityGroup }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.manufacturer }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.poNumber }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.salesOrderNo }}</td>
                                    <td class="px-4 py-3 font-medium text-gray-700">{{ row.workorder }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.salesExecutive }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.orderDate }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.woAgeing }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.lastMoveDays }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.orderRemarks }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.overDueDays }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.orderType }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.stockType }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.orderedQuantity }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.bagGenerationDate }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.noOfBags }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.quantityPerBag }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.customerName }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.deliveryDate }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.design }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.category }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.categoryCode }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.subCategory }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.productionDelays }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.issueDate }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.ringSize }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.metalStoneQuality }}</td>
                                    <td class="px-4 py-3 text-gray-600">{{ row.metalStoneColor }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.partyDiamondWeight }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.actualDiamondWeightCt }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.lotMetalIssueDays }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedDiamondPiecesNew }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedDiamondWeightTest }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedDiamondWeight }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedGrossWeightNew }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedMetalPureWeight }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.expectedNetWeightNew }}</td>
                                    <td class="px-4 py-3 text-right text-gray-700">{{ row.actualMetalPureWeight }}</td>
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
                        <span class="text-xs text-gray-500">Page {{ currentPage }}</span>
                        <div class="flex items-center gap-1.5">
                            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1"
                                class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                                <i class="fas fa-angle-left"></i> Previous
                            </button>
                            <template v-for="(p, idx) in pageWindow" :key="idx">
                                <span v-if="p === null" class="px-1 text-sm text-gray-400">&hellip;</span>
                                <button v-else @click="goToPage(p)"
                                    class="px-3 py-1.5 text-sm rounded-md border"
                                    :class="p === currentPage
                                        ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'">
                                    {{ p }}
                                </button>
                            </template>
                            <button @click="goToPage(currentPage + 1)" :disabled="!hasNextPage"
                                class="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                                Next <i class="fas fa-angle-right"></i>
                            </button>
                        </div>
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

const PAGE_SIZE = 20;

export default {
    name: 'ActualWIPReport',
    setup() {
        const $toast = useToast();
        const { fetchActualWipData, actualWipData } = useAllReportsApi();
        const loading = ref(true);
        const wipData = ref([]);

        const skeletonRowCount = PAGE_SIZE;
        const showDropdown = ref(false);
        const currentPage = ref(1);
        const totalPages = ref(0);
        const totalCount = ref(0);
        const hasNextPage = ref(false);

        const toggleDropdown = () => {
            showDropdown.value = !showDropdown.value;
        };

        const loadPage = async (page) => {
            loading.value = true;
            try {
                await fetchActualWipData({}, {
                    page,
                    pageSize: PAGE_SIZE,
                });
                wipData.value = actualWipData.value.data || [];
                currentPage.value = actualWipData.value.page || page;
                totalPages.value = actualWipData.value.totalPages || 0;
                totalCount.value = actualWipData.value.totalCount || 0;
                // Don't rely solely on totalPages/totalCount (backend COUNT can
                // fail independently of the main data query) -- a full page of
                // rows means there may be a next page regardless.
                hasNextPage.value = wipData.value.length === PAGE_SIZE;
            } catch (error) {
                $toast.error("Error fetching data", { position: "top" });
            } finally {
                loading.value = false;
            }
        };

        const goToPage = (page) => {
            if (page < 1 || page === currentPage.value) { return; }
            loadPage(page);
        };

        // Effective last known page: the real totalPages when the backend
        // COUNT succeeded, otherwise just far enough to cover the current
        // page (plus one more if we know another page exists).
        const knownLastPage = computed(() => {
            if (totalPages.value > 0) { return totalPages.value; }
            return currentPage.value + (hasNextPage.value ? 1 : 0);
        });

        // Page numbers to render: always first and last, a window around the
        // current page, and `null` entries where a "..." gap belongs.
        const pageWindow = computed(() => {
            const last = knownLastPage.value;
            const current = currentPage.value;
            if (last <= 1) { return [1]; }

            const windowSize = 1;
            const pages = new Set([1, last]);
            for (let p = current - windowSize; p <= current + windowSize; p++) {
                if (p >= 1 && p <= last) { pages.add(p); }
            }

            const sorted = [...pages].sort((a, b) => a - b);
            const result = [];
            for (let i = 0; i < sorted.length; i++) {
                if (i > 0 && sorted[i] - sorted[i - 1] > 1) { result.push(null); }
                result.push(sorted[i]);
            }
            return result;
        });

        const filteredData = computed(() => wipData.value);

        const totalWorkOrders = computed(() => totalCount.value);

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
            await loadPage(1);
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
            currentPage,
            totalPages,
            totalCount,
            hasNextPage,
            pageWindow,
            goToPage,
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
    height: 600px !important;
    overflow: auto;
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
