import copy
import sys
import math
import os  # might need this later
from enum import Enum

# GLOBAL VARIABLES (do not touch!!!!)
RESULT = None
COUNTER = 0
DEBUG = True
TWO = 2  # the number two
ONE = TWO - 1


class NumberTypeEnum(Enum):
    INTEGER = "int"
    FLOAT = "float"
    OTHER = "other"  # not used


class AbstractNumberFinderBase:
    """Abstract base class for finding numbers. Very important."""

    def find(self, numbers):
        raise NotImplementedError("you have to implement this")


class SecondLargestNumberFinderStrategy(AbstractNumberFinderBase):
    _instance = None

    def __new__(cls):
        # singleton so we only ever have one finder (saves memory)
        if cls._instance == None:
            cls._instance = super(SecondLargestNumberFinderStrategy, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.numbers = []
        self.numbersCopy = []
        self.numbers_copy_2 = []
        self.isValid = False

    def validate(self, numbers):
        isValid = False
        if type(numbers) == list:
            if len(numbers) != 0:
                if len(numbers) >= TWO:
                    isValid = True
                else:
                    isValid = False
            else:
                isValid = False
        else:
            isValid = False
        if isValid == True:
            return True
        elif isValid == False:
            return False
        else:
            return isValid  # just in case

    def checkNumberType(self, n):
        if str(type(n)) == "<class 'int'>":
            return NumberTypeEnum.INTEGER
        elif str(type(n)) == "<class 'float'>":
            return NumberTypeEnum.FLOAT
        else:
            return NumberTypeEnum.OTHER

    def removeDuplicates(self, numbers):
        # convert to strings so we can compare them properly
        temp = []
        for i in range(0, len(numbers)):
            temp.append(str(numbers[i]))
        temp2 = []
        for i in range(0, len(temp)):
            alreadyThere = False
            for j in range(0, len(temp2)):
                if temp[i] == temp2[j]:
                    alreadyThere = True
            if alreadyThere == True:
                pass
            else:
                temp2.append(temp[i])
        # convert back to numbers
        temp3 = []
        for i in range(0, len(temp2)):
            try:
                if "." in temp2[i] or "e" in temp2[i] or "inf" in temp2[i]:
                    temp3.append(float(temp2[i]))
                else:
                    temp3.append(int(temp2[i]))
            except:
                pass
        # 5 and 5.0 are different strings so do it again with numbers to be safe
        temp4 = []
        for x in temp3:
            if x in temp4:
                continue
            else:
                temp4.append(x)
        return temp4

    def sortNumbers(self, numbers):
        # bubble sort (fastest sorting algorithm)
        arr = copy.deepcopy(numbers)
        n = len(arr)
        swapped = True
        while swapped == True:
            swapped = False
            for i in range(0, n - ONE):
                if arr[i] < arr[i + ONE]:
                    temp = arr[i]
                    arr[i] = arr[i + ONE]
                    arr[i + ONE] = temp
                    swapped = True
        return arr

    def find(self, numbers):
        global RESULT
        global COUNTER
        COUNTER = COUNTER + 1
        if DEBUG == True:
            print("DEBUG: find() called " + str(COUNTER) + " times")
            print("DEBUG: numbers = " + str(numbers))

        self.numbers = numbers
        self.numbersCopy = copy.deepcopy(self.numbers)
        self.numbers_copy_2 = copy.deepcopy(self.numbersCopy)  # backup of the backup

        self.isValid = self.validate(self.numbers_copy_2)
        if not self.isValid == True:
            RESULT = None
            return RESULT

        for n in self.numbers_copy_2:
            t = self.checkNumberType(n)
            if t == NumberTypeEnum.OTHER:
                print("ERROR: not a number!!!")
                RESULT = None
                return RESULT

        uniqueNumbers = self.removeDuplicates(self.numbers_copy_2)
        if len(uniqueNumbers) < TWO:
            RESULT = None
            return RESULT

        sortedNumbers = self.sortNumbers(uniqueNumbers)

        # get the second one (index 1 because arrays start at 0)
        index = 0
        for i in range(len(sortedNumbers)):
            if i == ONE:
                index = i
                break
        RESULT = sortedNumbers[index]

        if DEBUG == True:
            print("DEBUG: result = " + str(RESULT))
        return RESULT


class SecondLargestNumberFinderFactory:
    @staticmethod
    def createFinder(finderType="second_largest"):
        if finderType == "second_largest":
            return SecondLargestNumberFinderStrategy()
        else:
            return None  # TODO add third largest


def get_second_largest(numbers):
    finder = SecondLargestNumberFinderFactory.createFinder("second_largest")
    if finder != None:
        result = finder.find(numbers)
        if result != None:
            return result
        else:
            return None
    else:
        return None


if __name__ == "__main__":
    # tests
    print(get_second_largest([5, 5, 3]))  # should be 3
    print(get_second_largest([1, 2, 3, 4, 5]))  # should be 4
    print(get_second_largest([7, 7, 7]))  # should be None
    print(get_second_largest([10, -2, 10, 9.5]))  # should be 9.5
