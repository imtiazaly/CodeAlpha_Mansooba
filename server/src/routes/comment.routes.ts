import { Router } from "express";
import { CommentController } from "../controllers/comment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema,
} from "../schemas/comment.schema.js";

// mergeParams: true allows accessing :taskId from parent route
const router = Router({ mergeParams: true });

router.use(authenticate);

router
  .route("/")
  .post(validate(createCommentSchema), CommentController.createComment)
  .get(validate(getCommentsSchema), CommentController.getComments);

router
  .route("/:id")
  .delete(validate(deleteCommentSchema), CommentController.deleteComment);

export const commentRoutes = router;
