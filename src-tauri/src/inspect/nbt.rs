use serde_json::{Map, Value};

pub struct NbtReader<'a> {
    data: &'a [u8],
    pub offset: usize,
}

impl<'a> NbtReader<'a> {
    pub fn new(data: &'a [u8]) -> Self {
        Self { data, offset: 0 }
    }

    fn read_exact(&mut self, size: usize) -> Result<&'a [u8], String> {
        let end = self.offset.saturating_add(size);
        if end > self.data.len() {
            return Err(format!(
                "expected {} bytes, got {}",
                size,
                self.data.len().saturating_sub(self.offset)
            ));
        }
        let slice = &self.data[self.offset..end];
        self.offset = end;
        Ok(slice)
    }

    pub fn read_u8(&mut self) -> Result<u8, String> {
        Ok(self.read_exact(1)?[0])
    }

    pub fn read_u16_le(&mut self) -> Result<u16, String> {
        let raw = self.read_exact(2)?;
        Ok(u16::from_le_bytes([raw[0], raw[1]]))
    }

    pub fn read_i16_le(&mut self) -> Result<i16, String> {
        let raw = self.read_exact(2)?;
        Ok(i16::from_le_bytes([raw[0], raw[1]]))
    }

    pub fn read_i32_le(&mut self) -> Result<i32, String> {
        let raw = self.read_exact(4)?;
        Ok(i32::from_le_bytes([raw[0], raw[1], raw[2], raw[3]]))
    }

    pub fn read_i64_le(&mut self) -> Result<i64, String> {
        let raw = self.read_exact(8)?;
        Ok(i64::from_le_bytes([
            raw[0], raw[1], raw[2], raw[3], raw[4], raw[5], raw[6], raw[7],
        ]))
    }

    pub fn read_f32_le(&mut self) -> Result<f32, String> {
        let raw = self.read_exact(4)?;
        Ok(f32::from_le_bytes([raw[0], raw[1], raw[2], raw[3]]))
    }

    pub fn read_f64_le(&mut self) -> Result<f64, String> {
        let raw = self.read_exact(8)?;
        Ok(f64::from_le_bytes([
            raw[0], raw[1], raw[2], raw[3], raw[4], raw[5], raw[6], raw[7],
        ]))
    }

    pub fn read_utf8(&mut self) -> Result<String, String> {
        let len = self.read_u16_le()? as usize;
        let raw = self.read_exact(len)?;
        Ok(String::from_utf8_lossy(raw).to_string())
    }
}

fn value_from_f32(value: f32) -> Value {
    serde_json::Number::from_f64(value as f64)
        .map(Value::Number)
        .unwrap_or(Value::Null)
}

fn value_from_f64(value: f64) -> Value {
    serde_json::Number::from_f64(value)
        .map(Value::Number)
        .unwrap_or(Value::Null)
}

pub fn parse_nbt_payload(reader: &mut NbtReader<'_>, tag_id: u8) -> Result<Value, String> {
    match tag_id {
        0 => Ok(Value::Null),
        1 => Ok(Value::from(reader.read_u8()? as i64)),
        2 => Ok(Value::from(reader.read_i16_le()? as i64)),
        3 => Ok(Value::from(reader.read_i32_le()? as i64)),
        4 => Ok(Value::from(reader.read_i64_le()?)),
        5 => Ok(value_from_f32(reader.read_f32_le()?)),
        6 => Ok(value_from_f64(reader.read_f64_le()?)),
        7 => {
            let length = reader.read_i32_le()? as usize;
            let bytes = reader.read_exact(length)?;
            Ok(Value::Array(bytes.iter().map(|b| Value::from(*b)).collect()))
        }
        8 => Ok(Value::String(reader.read_utf8()?)),
        9 => {
            let child_id = reader.read_u8()?;
            let length = reader.read_i32_le()? as usize;
            let mut values = Vec::with_capacity(length);
            for _ in 0..length {
                values.push(parse_nbt_payload(reader, child_id)?);
            }
            Ok(Value::Array(values))
        }
        10 => {
            let mut map = Map::new();
            loop {
                let child_id = reader.read_u8()?;
                if child_id == 0 {
                    break;
                }
                let name = match reader.read_utf8() {
                    Ok(name) => name,
                    Err(err) => {
                        map.insert("_parse_error".into(), Value::String(err));
                        map.insert("_parse_error_offset".into(), Value::from(reader.offset as i64));
                        map.insert("_parse_error_tag_id".into(), Value::from(child_id));
                        return Ok(Value::Object(map));
                    }
                };
                match parse_nbt_payload(reader, child_id) {
                    Ok(value) => {
                        map.insert(name, value);
                    }
                    Err(err) => {
                        map.insert("_parse_error".into(), Value::String(err));
                        map.insert("_parse_error_offset".into(), Value::from(reader.offset as i64));
                        map.insert("_parse_error_tag_id".into(), Value::from(child_id));
                        return Ok(Value::Object(map));
                    }
                }
            }
            Ok(Value::Object(map))
        }
        11 => {
            let length = reader.read_i32_le()? as usize;
            let mut values = Vec::with_capacity(length);
            for _ in 0..length {
                values.push(Value::from(reader.read_i32_le()?));
            }
            Ok(Value::Array(values))
        }
        12 => {
            let length = reader.read_i32_le()? as usize;
            let mut values = Vec::with_capacity(length);
            for _ in 0..length {
                values.push(Value::from(reader.read_i64_le()?));
            }
            Ok(Value::Array(values))
        }
        _ => Err(format!("unknown tag id {}", tag_id)),
    }
}

pub fn value_object(value: &Value) -> Option<&Map<String, Value>> {
    match value {
        Value::Object(map) => Some(map),
        _ => None,
    }
}
