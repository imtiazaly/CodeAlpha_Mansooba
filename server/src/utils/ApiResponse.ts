export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T;
  public meta?: Record<string, any>;

  constructor(
    statusCode: number,
    data: T,
    message: string = "Success",
    meta?: Record<string, any>,
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}
