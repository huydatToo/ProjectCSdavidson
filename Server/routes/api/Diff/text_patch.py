import difflib
import re

# the functions creates a text changes patch
def create_patch(original: str, modified: str) -> str:
    diffs = difflib.unified_diff(original.splitlines(True), modified.splitlines(True), n=0)
    try:
        _, _ = next(diffs), next(diffs)
    except StopIteration:
        pass

    return ''.join([d if d[-1] == '\n' else d + '\n' + "\\" + '\n' for d in diffs])

# the function apply text changes patch
def apply_patch(original: str, patch: str) -> str:
    original = original.splitlines(True)
    patch = patch.splitlines(True)
    result = ''
    i = sl = 0

    while i < len(patch) and patch[i].startswith(("---", "+++")):
        i += 1  # skip header lines

    while i < len(patch):
        m = re.match(r"^@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@", patch[i])

        if not m:
            raise Exception("Bad patch -- regex mismatch [line " + str(i) + "]")
        l = int(m.group(3)) - 1 + (m.group(4) == '0')
        
        if sl > l or l > len(original):
            raise Exception("Bad patch -- bad line num [line " + str(i) + "]")

        result += ''.join(original[sl:l])
        sl = l
        i += 1

        while i < len(patch) and patch[i][0] != '@':
            if i + 1 < len(patch) and patch[i + 1][0] == '\\':
                line = patch[i][:-1]
                i += 2
            else:
                line = patch[i]
                i += 1
            if len(line) > 0:
                if line[0] == '+' or line[0] == ' ':
                    result += line[1:]
                sl += (line[0] != '+')

    result += ''.join(original[sl:])
    return result