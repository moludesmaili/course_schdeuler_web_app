import json

# Load the dependencies and goal JSON files
def load_json(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def create_high_priority_courses(dependencies):
    high_priority_courses = []
    # Iterate through the dependencies dictionary
    for course, data in dependencies.items():
        # Check if the course has one or more dependents
        if data.get("dependents"):
            high_priority_courses.append(course)

    return high_priority_courses

def create_failed_courses(goal_schedule, next_semester, taken_courses, high_priority_courses):
    failed_to_retake = []
    # Iterate through all semesters before the next semester
    for semester in goal_schedule["semesters"]:
        if semester["name"] == next_semester:
            break  # Stop at the next semester

        # Check each course in the semester
        for course in semester["courses"]:
            if course in high_priority_courses and course not in taken_courses:
                failed_to_retake.append(course)

    return failed_to_retake

# Helper function to get dependents of a course
def get_dependents(course, dependencies):
    return dependencies.get(course, {}).get('dependents', [])

# Check if a course can be taken based on prerequisites
def can_take_course(course, taken_courses, dependencies, new_courses, term):
    for prereq, data in dependencies.items():
        # Check if the course is available in this semester's term
        available_terms = dependencies[course].get("availability", ["Fall", "Spring", "Summer"])
        if term not in available_terms:
            return False
        if course in data["dependents"] and (prereq not in taken_courses or prereq in new_courses):
            return False  # Prerequisite not satisfied or exists in the current semester's courses
    return True

#Function to check if the given course is a prerequisite for any other course
def is_prereq(course, dependencies):
    return len(dependencies.get(course, {}).get('dependents', [])) > 0


#Function to find the neareset available course to replace
def find_nearest_available_course(taken_courses, failed_to_retake, dependencies, new_courses, updated_schedule, current_semester_index, term, skipped_courses):
    # Iterate over the future semesters (starting from the current semester)
    for i in range(current_semester_index + 1, len(updated_schedule["semesters"])):
        semester = updated_schedule["semesters"][i]
        for course in semester["courses"]:
            # Skip any course that is in the skipped_courses list (for the replacement while and not adding the two credit course to the summer)
            if course in skipped_courses:
                continue  # Skip this course and check the next one
            # Skip CIS4250 but keep searching
            if course == "CIS4250":
                continue  # Don't return yet, keep looking for another course
            if course not in taken_courses and course not in failed_to_retake:
                if can_take_course(course, taken_courses, dependencies, new_courses, term):
                    return course, semester  # Return the first valid non-CIS4250 course

    return None, None


# Function to enforce credit limits per semester
# def enforce_credit_limits(semester, min_credits, max_credits, taken_courses, dependencies):
#     while semester["credits"] > max_credits:
#         # Move courses to the next semester if credits exceed max limit
#         for course in reversed(semester["courses"]):
#             if semester["credits"] > max_credits:
#                 dependents = get_dependents(course, dependencies)
#                 if not any(dep in semester["courses"] for dep in dependents):
#                     # Shift this course to the next semester if there are no dependents
#                     semester["courses"].remove(course)
#                     semester["credits"] -= dependencies[course]["credits"]
#             else:
#                 break
#     return semester

# Function for checking duolicated courses and the overall credits of the semesters 
# def prune_and_adjust_schedule(updated_schedule, dependencies, failed_to_retake):
#     for semester in updated_schedule["semesters"]:
#         unique_courses = list(dict.fromkeys(semester["courses"]))  # Remove duplicate courses
#         semester["courses"] = unique_courses
#         semester["credits"] = sum(dependencies[course]["credits"] for course in unique_courses)
#     if (failed_to_retake):
#         if ((updated_schedule["semesters"][-1]["credits"]) <= 19)
#                     or (semester["name"] == "Summer1" and (semester["credits"] + dependencies[replacement]["credits"]) <= 9)):
#         # print(updated_schedule["semesters"][-1], "last semester")
#         semester["courses"].append(replacement)
#         taken_courses.append(replacement)
#         semester["credits"] += dependencies[replacement]["credits"]
#     return updated_schedule

# Handle the single course or two single courses in the last semester
def handle_single_course_last_semester(updated_schedule, dependencies):
    # Identify the last and second-to-last semesters
    last_semester = updated_schedule["semesters"][-1]
    second_to_last_semester = updated_schedule["semesters"][-2]

    # Check if the last semester has only one course
    if len(last_semester["courses"]) == 1:
        single_course = last_semester["courses"][0]
        course_credits = dependencies[single_course]["credits"]

        # Check if the second-to-last semester can accommodate the course
        if second_to_last_semester["credits"] + course_credits <= 18:
            # Move the course
            second_to_last_semester["courses"].append(single_course)
            second_to_last_semester["credits"] += course_credits
            last_semester["courses"].remove(single_course)
            last_semester["credits"] -= course_credits

# Handle the single course or two single courses in the last semester
# def handle_single_course_last_semester(updated_schedule, dependencies):
#     # Identify the last and second-to-last semesters
#     last_semester = updated_schedule["semesters"][-1]
#     second_to_last_semester = updated_schedule["semesters"][-2]

#     # Check if the last semester has one or two courses
#     if len(last_semester["courses"]) <= 2:
#         total_credits = sum(dependencies[course]["credits"] for course in last_semester["courses"])

#         # Check if the second-to-last semester can accommodate the courses
#         if second_to_last_semester["credits"] + total_credits <= 22:
#             # Move the courses
#             for course in last_semester["courses"][:]:  # Use a copy of the list to avoid modification during iteration
#                 second_to_last_semester["courses"].append(course)
#                 second_to_last_semester["credits"] += dependencies[course]["credits"]
#                 last_semester["courses"].remove(course)
#                 last_semester["credits"] -= dependencies[course]["credits"]



def ensure_ethical_course_in_last_semester(updated_schedule, dependencies):
    ETHICAL_COURSE = "CIS4250"

    # Step 1: Remove CIS4250 from any semester where it might have been placed
    for semester in updated_schedule["semesters"]:
        if ETHICAL_COURSE in semester["courses"]:
            semester["courses"].remove(ETHICAL_COURSE)
            semester["credits"] -= dependencies[ETHICAL_COURSE]["credits"]
            break  # Remove from the first occurrence and stop

    # Step 2: Identify the actual last semester (could be different from Semester 8)
    #last_semester = updated_schedule["semesters"][-1]
    # Step 2: Find the last non-empty semester (i.e., the last semester that has courses)
    last_semester = None
    for semester in reversed(updated_schedule["semesters"]):
        if semester["courses"]:  # Check if the semester has courses
            last_semester = semester
            break
    

    # Step 3: Add CIS4250 to the last semester if it is not already taken
    if ETHICAL_COURSE not in last_semester["courses"]:
        last_semester["courses"].append(ETHICAL_COURSE)
        last_semester["credits"] += dependencies[ETHICAL_COURSE]["credits"]


def manage_credit_limit(updated_schedule, goal_schedule, dependencies):
    # Identify the last semester in the updated schedule
    last_semester_name = updated_schedule["semesters"][-1]["name"]

    # Loop through each semester in the updated schedule
    for semester in updated_schedule["semesters"]:
        semester_key = str(semester["name"])  # Use the name of the semester as the key

        # Search for the corresponding semester in the goal_schedule
        goal_semester = next((s for s in goal_schedule["semesters"] if s["name"] == semester_key), None)
        
        if not goal_semester:
            print(f"Semester {semester_key} not found in goal_schedule!")
            continue

        goal_courses = goal_semester["courses"]  # Extract the goal courses for this semester

        # Determine max credits based on whether it's the last semester
        max_credits = 19 if semester["name"] == last_semester_name else 15

        # Check if the semester has more than the allowed credits
        # while semester["credits"] > max_credits:
        #     course_to_move = None

        #     # Find a course to move based on priority
        #     for course in semester["courses"]:
        #         # Priority 1: Not a prerequisite and not in the goal schedule for this semester
        #         if not is_prereq(course, dependencies) and course not in goal_courses:
        #             course_to_move = course
        #             break  # Move this course out
        #         # Priority 2: Not a prerequisite but in the goal schedule for this semester
        #         elif not is_prereq(course, dependencies) and course in goal_courses:
        #             course_to_move = course

        #     if course_to_move:
        #         # Move to Summer1 if current semester is between 1 and 4
        #         if int(semester["name"]) <= 4:
        #             summer1_semester = updated_schedule["semesters"][find_semester_by_name(updated_schedule, "Summer1")]
        #             if summer1_semester["credits"] + dependencies[course_to_move]["credits"] <= 9:
        #                 summer1_semester["courses"].append(course_to_move)
        #                 summer1_semester["credits"] += dependencies[course_to_move]["credits"]
        #                 semester["courses"].remove(course_to_move)
        #                 semester["credits"] -= dependencies[course_to_move]["credits"]
        #             else:
        #                 print("Cannot fit in Summer1, more than 15 credits.")
        #                 break
        #         # Move to Semester 8 if current semester is between 5 and 7
        #         elif 5 <= int(semester["name"]) <= 7:
        #             semester8 = updated_schedule["semesters"][find_semester_by_name(updated_schedule, "8")]
        #             if semester8["credits"] + dependencies[course_to_move]["credits"] <= max_credits:
        #                 semester8["courses"].append(course_to_move)
        #                 semester8["credits"] += dependencies[course_to_move]["credits"]
        #                 semester["courses"].remove(course_to_move)
        #                 semester["credits"] -= dependencies[course_to_move]["credits"]
        #             else:
        #                 print("Cannot fit in Semester 8, more than max credits.")
        #                 break
        #     else:
        #         # If no course found to move, exit the while loop
        #         print(f"No course found to move from {semester['name']}.")
        #         break
    
    # Call helper function to handle single-course last semesters
    handle_single_course_last_semester(updated_schedule, dependencies)
    ensure_ethical_course_in_last_semester(updated_schedule, dependencies)


# Helper function to find a semester by name
def find_semester_by_name(schedule, semester_name):
    for idx, semester in enumerate(schedule["semesters"]):
        if semester["name"] == semester_name:
            return idx
    return -1

# Function to calculate the similarity score between updated_schedule and goal_schedule
def calculate_similarity_score(goal_schedule, updated_schedule):
    total_courses = 0
    matching_courses = 0
    total_similarity= 0
    goal_schedule = load_json('api/engine/goal.json')

    # Loop through each semester in the goal schedule
    for goal_semester in goal_schedule["semesters"]:
        goal_semester_name = goal_semester["name"]
        goal_courses = set(goal_semester["courses"])  # Convert to set for easier comparison

        # Find the corresponding semester in the updated schedule
        updated_semester = next((sem for sem in updated_schedule["semesters"] if sem["name"] == goal_semester_name), None)
        
        if updated_semester:
            updated_courses = set(updated_semester["courses"])  # Convert new bin nodes to set
            # Calculate the intersection size (similarity for this bin)
            similarity = len(goal_courses.intersection(updated_courses))
            total_courses += len(updated_courses)  # Increment total number of nodes
            total_similarity += similarity
    
    # Calculate the total similarity score
    similarity_score = total_similarity / total_courses if total_courses > 0 else 0
    return similarity_score


# Function to adjust the course schedule based on taken and failed courses
def adjust_schedule(goal_schedule, next_semester, taken_courses, failed_to_retake, dependencies):
    updated_schedule = goal_schedule.copy()
    # The courses assigned to previous semesters but were not taken intentionally (not failed)
    intentionally_not_taken = []  
    prereq_courses = [course for course in dependencies if is_prereq(course, dependencies)]
    current_semester_index = next(i for i, s in enumerate(updated_schedule["semesters"]) if s["name"] == next_semester)
    total_credits = 0
    # Add credits of taken courses
    total_credits += sum(dependencies[course]["credits"] for course in taken_courses if course in dependencies)
    # Initialize the skipped_courses list
    skipped_courses = []


    # for semester in updated_schedule["semesters"]:
    #     if semester["name"] == next_semester:
    
    for semester_idx in range(current_semester_index, len(updated_schedule["semesters"])):
        semester = updated_schedule["semesters"][semester_idx]
        new_courses = []
        current_credits = 0  # Initialize current credits for the semester
        ethical_course = "CIS4250"
        term = semester["term"]
        
        # Adjust the courses
        # Add the courses in the semester based on the catalog first
        for course in semester["courses"]:
            if course not in taken_courses:
                #add the prereq check
                if can_take_course(course, taken_courses, dependencies, new_courses, term):
                    new_courses.append(course)
                    taken_courses.append(course)
                    # Update current credits after adding the course
                    current_credits += dependencies[course]["credits"]  
                else:
                    failed_to_retake.append(course)
        print(new_courses, semester["name"])
        # Add failed courses
        to_remove = []
        for failed in failed_to_retake[:]:
            # Ensure we can add the course and credit limits allow it
            if can_take_course(failed, taken_courses, dependencies, new_courses, term):
                print(current_credits, failed)
                if (
                    (semester["name"] != "Summer1" and (current_credits + dependencies[failed]["credits"]) <= 15) 
                    or (semester["name"] != "Summer1" and (current_credits + dependencies[failed]["credits"]) <= 9)
                ):
                    new_courses.append(failed)
                    taken_courses.append(failed)
                    to_remove.append(failed)  # Mark for removal
                    current_credits += dependencies[failed]["credits"]
        
        # Remove processed courses after the loop
        for course in to_remove:
            failed_to_retake.remove(course)
    
        # Skip the empty semester to avoid infinite loops
        # if not semester["courses"] and semester["credits"] == 0:
        #     continue
        # Collect the intentionally not taken courses
        
        for prev_semester_idx in range(current_semester_index):
            earlier_semester = updated_schedule["semesters"][prev_semester_idx]
            for course in earlier_semester["courses"]:
                if course not in taken_courses and course not in failed_to_retake and course not in intentionally_not_taken:  # Not taken or failed
                    intentionally_not_taken.append(course)
        #Add intentionally not taken courses
        for course in intentionally_not_taken[:]:
            if can_take_course(course, taken_courses, dependencies, new_courses, term):
                new_courses.append(course)
                taken_courses.append(course)
                current_credits += dependencies[course]["credits"]
                intentionally_not_taken.remove(course)
        
        #Update the update_schedule and its credits before goinf to check empty places 
        semester["courses"] = new_courses
        semester["credits"] = sum(dependencies[course]["credits"] for course in semester["courses"])

        #check if there is place for adding more courses
        print(new_courses, semester["name"])
        #if semester["courses"]:
        while (semester["name"] != "Summer1" and semester["credits"] <= 12) or (semester["name"] == "Summer1" and semester["credits"] <= 6):
            replacement, original_semester = find_nearest_available_course(taken_courses, failed_to_retake, dependencies, new_courses, updated_schedule, current_semester_index, term, skipped_courses)
            if semester["name"] == "Summer1" and replacement == "EGN4450":
                skipped_courses.append(replacement)  # Add EGN4450 to skipped_courses
                continue  # Go back to the start of the loop to get the next replacement
            if (replacement):
                if (semester["name"] != "Summer1" and (semester["credits"] + dependencies[replacement]["credits"]) <= 15):
                    semester["courses"].append(replacement)
                    taken_courses.append(replacement)
                    semester["credits"] += dependencies[replacement]["credits"]
                    if original_semester:
                        original_semester["courses"].remove(replacement)
                        original_semester["credits"] -= dependencies[replacement]["credits"]
                elif ((semester["name"] == "Summer1" and (semester["credits"] + dependencies[replacement]["credits"]) <= 9) and replacement != 'EGN4450'):
                    semester["courses"].append(replacement)
                    taken_courses.append(replacement)
                    semester["credits"] += dependencies[replacement]["credits"]
                    if original_semester:
                        original_semester["courses"].remove(replacement)
                        original_semester["credits"] -= dependencies[replacement]["credits"]
                elif ((semester["name"] == "Summer1" and (semester["credits"] + dependencies[replacement]["credits"]) <= 9) and replacement == 'EGN4450'):
                    continue
            else:
                break  # Exit the loop if no valid replacement is found         

        # Update the courses in the semester
        #update the updated_schedule after the while
        semester["courses"] = new_courses
        semester["credits"] = sum(dependencies[course]["credits"] for course in semester["courses"])
        #update total credits of the schedule
        total_credits += semester["credits"]
        
        
  
    # After updating all semesters, remove the unnecessary courses and re-adjust for consistency.
    #updated_schedule = prune_and_adjust_schedule(updated_schedule, dependencies, failed_to_retake)
    manage_credit_limit(updated_schedule, goal_schedule, dependencies)
    

    # Calculate the similarity score after adjusting the schedule
    similarity_score = calculate_similarity_score(goal_schedule, updated_schedule)
    print("Similarity Score is :", similarity_score)


    return updated_schedule, total_credits, similarity_score


def calculate(next_semester,taken_courses,dependencies,goal_schedule):
    # Generate high-priority courses
    high_priority_courses = create_high_priority_courses(dependencies)
    
    # Generate failed courses
    failed_to_retake = create_failed_courses(goal_schedule, next_semester, taken_courses, high_priority_courses)
    
    new_schedule, total_credits, similarity_score = adjust_schedule(goal_schedule, next_semester, taken_courses, failed_to_retake, dependencies)
    res = ""
    for semester in new_schedule["semesters"]:
        if semester["id"] >= next_semester:  # Print semesters starting from the next semester
            course_labels = [dependencies[course]["label"] if course in dependencies else course for course in semester["courses"]]
            res += (f'Semester: {semester["name"]}, Courses: {course_labels}, Credits: {semester["credits"]}<br/>')
    return res

# dependencies = load_json('api/engine/course_dep.json')
# goal_schedule = load_json('api/engine/goal.json')
# calculate("2",["ENC1101","EGN3000/3000L","NatSciElec1"],["MAC2281"],dependencies,goal_schedule)
# # Main function
# def main():
#     # Load input JSON files
#     dependencies = load_json('dependencies.json')
#     goal_schedule = load_json('goal.json')

#     # Get inputs from the user
#     next_semester = input("Enter the next semester: ")
#     taken_courses = input("Enter taken courses separated by commas: ").split(',')
#     failed_courses = input("Enter failed courses separated by commas: ").split(',')

#     # Remove any extra spaces from the inputs
#     taken_courses = [course.strip() for course in taken_courses]
#     failed_courses = [course.strip() for course in failed_courses]

#     # Adjust the schedule based on user input
#     new_schedule, total_credits, similarity_score = adjust_schedule(goal_schedule, next_semester, taken_courses, failed_courses, dependencies)
    

#     # Print the adjusted schedule from the next semester onward
#     print("\nAdjusted Schedule:")
#     for semester in new_schedule["semesters"]:
#         if semester["name"] >= next_semester:  # Print semesters starting from the next semester
#             print(f'Semester: {semester["name"]}, Courses: {semester["courses"]}, Credits: {semester["credits"]}')
#     print("\nTotal credit:", {total_credits})
#     print(f"Similarity score: {similarity_score:.2f}%")

# if __name__ == "__main__":
#     main()
