const NewArrivalsSkeleton = () => (
  <div className="container mx-auto mt-10">
    <div className="flex-none w-[calc(80%-1rem)] sm:w-[calc(40%-1rem)] md:w-[calc(25%-1rem)] lg:w-[calc(20%-1rem)] xl:w-[calc(20%-1rem)] m-2 bg-gray-100 rounded-lg shadow-md border border-gray-200 animate-pulse">
      <div className="relative w-full h-40 bg-gray-200 rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="p-4 flex flex-col space-y-2">
        <div className="flex justify-between space-x-2">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
        </div>
        <div className="h-10 bg-gray-200 rounded-full w-full" />
      </div>
    </div>
  </div>
);

export default NewArrivalsSkeleton;
