# write the code to get the smallest number in the array in an easier way
def get_smallest_number(arr):
  min = 0
  for i in arr:
    if i < min:
      min = i
  return min



