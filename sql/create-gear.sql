create table if not exists gear (
  id varchar unique primary key,
  brand_name varchar,
  model_name varchar,
  frame_type int,
  description varchar
);
