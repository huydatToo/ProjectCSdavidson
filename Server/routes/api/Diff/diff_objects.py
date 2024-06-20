class Change:
    def __init__(self, diff_type: str, old_name: str=None, new_name: str=None) -> None:
        self.diff_type = diff_type
        self.old_name = old_name
        self.new_name = new_name


class FileChange(Change):
    pass


class FolderChange(Change):
    def __init__(self, diff_type: str, old_name: str=None, new_name: str=None) -> None:
        super().__init__(diff_type, old_name, new_name) 
        self.diff_list = []

    def add_change(self, new_change: FileChange) -> None:
        self.diff_list.append(new_change)


class Conflicted_file(Change):
    def __init__(self, configuration: int, diff_type: str, old_name=None, new_name=None) -> None:
        super().__init__(diff_type, old_name, new_name) 
        self.configuration = configuration
