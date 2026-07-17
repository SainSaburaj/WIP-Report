<template>
    <div class="min-h-screen w-full p-6 bg-gray-50">
        <!-- Header -->
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-8 mt-20">
                <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">WIP Report</h1>
                <p class="text-sm text-gray-500 mt-4">Select a report type to view work-in-progress details</p>
            </div>

            <!-- WIP Report Cards -->
            <div class="flex gap-6 flex-wrap justify-center">
                <!-- Actual WIP Report Card -->
                <router-link :to="{ name: 'ActualWIPReport' }" class="relative flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 h-40 w-64">
                    <div class="bg-gray-200 rounded-full flex items-center justify-center w-16 h-16 mb-4 transition-colors duration-300 hover:bg-gray-300">
                        <i class="fas fa-clipboard-list text-3xl text-gray-600"></i>
                    </div>
                    <div class="text-center">
                        <h3 class="text-base font-bold text-gray-800">Actual WIP Report</h3>
                        <p class="mt-2 text-xs text-gray-600">Current work-in-progress status</p>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WIPReport'
};
</script>

<style scoped>
a {
    text-decoration: none;
}
</style>
