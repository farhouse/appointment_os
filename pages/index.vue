<template>
  <div class="text-center py-20">
    <h1 class="text-5xl font-bold mb-4">Welcome to Barber OS</h1>
    <p class="text-xl text-gray-600 mb-8">Manage your barbershop efficiently</p>
    <div class="flex justify-center gap-4">
      <UButton to="/calendar" size="xl" color="primary">View Calendar</UButton>
      <UButton to="/bookings" size="xl" variant="outline">Manage Bookings</UButton>
    </div>
  </div>
</template>
