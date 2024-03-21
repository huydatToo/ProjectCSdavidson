class NotFoundOnIPFS(Exception):
    def __init__(self, message="File Was Not Found On IPFS"):
        self.message = message
        super().__init__(self.message)
